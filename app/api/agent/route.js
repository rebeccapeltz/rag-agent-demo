import Anthropic from "@anthropic-ai/sdk";

// This file runs on the server only. The API key never reaches the browser —
// that's the whole reason this is a Next.js route instead of a client-side
// fetch, and it's the same proxy pattern as the dashboard demo.
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT =
  "You are a helpful assistant. When the user wants a quote, use the " +
  "get_random_quote tool rather than making one up. The tool returns a " +
  "genuinely random quote and has no way to filter by author or topic — " +
  "if the user asks for a specific author, call the tool once, then tell " +
  "them honestly whose quote you got and that the tool can't target a " +
  "particular author, rather than calling it repeatedly hoping for a match. " +
  "When you present a quote, do not use Markdown syntax (no asterisks, no " +
  "blockquote arrows). Format it as exactly two lines: the quote text in " +
  "quotation marks on the first line, then an em dash and the author's " +
  "name on the second line, with no extra commentary on those two lines. " +
  "Any additional explanation (such as noting the tool can't filter by " +
  "author) should go in a separate line after those two.";

const tools = [
  {
    name: "get_random_quote",
    description:
      "Returns one random inspirational quote with its author. Cannot " +
      "filter or search by author, topic, or keyword — every call returns " +
      "a genuinely random quote from the pool.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
];

async function getRandomQuote() {
  const res = await fetch("https://dummyjson.com/quotes/random");
  if (!res.ok) throw new Error("Quote API request failed");
  return res.json();
}

// Belt-and-suspenders: the system prompt asks for plain text, but models
// don't always comply perfectly. Strip common Markdown syntax in code so
// the output is clean regardless of what the model actually produced.
function stripMarkdown(text) {
  return text
    .split("\n")
    .map((line) => line.replace(/^>\s?/, "")) // leading blockquote markers
    .join("\n")
    .replace(/\*\*(.+?)\*\*/g, "$1") // **bold**
    .replace(/\*(.+?)\*/g, "$1") // *italics*
    .replace(/^[-–—]{2,}\s*/gm, "— ") // -- or --- at line start -> a single em dash
    .trim();
}

export async function POST(req) {
  try {
    const { message, nomen } = await req.json();

    // Lightweight shared-passcode gate — not per-user auth, just keeps the
    // endpoint from being wide open to anyone who finds the URL.
    if (!process.env.NOMEN_KEY || nomen !== process.env.NOMEN_KEY) {
      return Response.json({ error: "Incorrect passcode" }, { status: 401 });
    }

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Missing message" }, { status: 400 });
    }

    const trace = [];
    const messages = [{ role: "user", content: message }];

    trace.push(`Sent your message to ${MODEL}, along with the get_random_quote tool definition.`);

    let response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    // Loop instead of a single if — a model can reasonably ask for the same
    // tool more than once in a row (e.g. hoping a second random draw matches
    // what the user wanted). Capped at 3 rounds so a confused model can't
    // loop forever and run up the bill.
    let rounds = 0;
    while (response.stop_reason === "tool_use" && rounds < 3) {
      rounds++;
      const toolUseBlock = response.content.find((b) => b.type === "tool_use");

      if (!toolUseBlock) break; // shouldn't happen, but don't hang if it does

      trace.push(`Model requested the tool: ${toolUseBlock.name}() — round ${rounds}.`);

      let toolResultContent;
      try {
        const quote = await getRandomQuote();
        toolResultContent = JSON.stringify(quote);
        trace.push("Ran get_random_quote() for real — fetched from dummyjson.com/quotes/random.");
      } catch (err) {
        toolResultContent = JSON.stringify({ error: "Failed to fetch a quote." });
        trace.push("Tool execution failed — the model will be told the tool errored.");
      }

      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUseBlock.id,
            content: toolResultContent,
          },
        ],
      });

      trace.push("Sent the real tool result back to the model.");

      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });
    }

    trace.push(
      rounds > 0
        ? "Model wrote a final answer using the tool result(s)."
        : "Model answered directly — it decided it didn't need the tool."
    );

    const textBlock = response.content.find((b) => b.type === "text");
    const rawAnswer = textBlock ? textBlock.text : "I wasn't able to generate a text answer — try rephrasing.";
    return Response.json({
      answer: stripMarkdown(rawAnswer),
      trace,
    });
  } catch (err) {
    // Log the real error server-side (visible in Vercel's Functions/Logs
    // tab) and also surface a short version to the client, instead of
    // letting Next.js return a bare, undiagnosable 500.
    console.error("agent route error:", err);
    return Response.json(
      { error: "Agent request failed", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
