import Anthropic from "@anthropic-ai/sdk";

// This file runs on the server only. The API key never reaches the browser —
// that's the whole reason this is a Next.js route instead of a client-side
// fetch, and it's the same proxy pattern as the dashboard demo.
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
console.log("KEY LENGTH:", (process.env.ANTHROPIC_API_KEY || "").length);
console.log("KEY PREFIX:", (process.env.ANTHROPIC_API_KEY || "").slice(0, 7));
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT =
  "You are a helpful assistant. When the user wants a quote, use the " +
  "get_random_quote tool rather than making one up.";

const tools = [
  {
    name: "get_random_quote",
    description: "Returns a random inspirational quote with its author.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
];

async function getRandomQuote() {
  const res = await fetch("https://dummyjson.com/quotes/random");
  if (!res.ok) throw new Error("Quote API request failed");
  return res.json();
}

export async function POST(req) {
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

  if (response.stop_reason === "tool_use") {
    const toolUseBlock = response.content.find((b) => b.type === "tool_use");
    trace.push(`Model requested the tool: ${toolUseBlock.name}() — it did not answer directly.`);

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

    trace.push("Sent the real tool result back to the model to write a final answer.");

    response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });
  } else {
    trace.push("Model answered directly — it decided it didn't need the tool.");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  return Response.json({ answer: textBlock ? textBlock.text : "", trace });
}
