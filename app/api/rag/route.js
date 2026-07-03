import Anthropic from "@anthropic-ai/sdk";
import { buildIndex, retrieve } from "../../../lib/tfidf";
import { DOCUMENTS } from "../../../lib/ragDocuments";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

// Built once when the server starts, reused across every request —
// there's no need to re-score the knowledge base's own word frequencies
// on every question.
const index = buildIndex(DOCUMENTS);

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
  trace.push("Received your question.");

  const topMatches = retrieve(message, DOCUMENTS, index, 3);
  trace.push(`Scored all ${DOCUMENTS.length} knowledge-base entries with TF-IDF cosine similarity.`);
  trace.push("Selected the top 3 matches to use as context.");

  const contextBlock = topMatches.map((m) => m.text).join("\n\n");
  trace.push(`Sent your question plus the retrieved context to ${MODEL}.`);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "Answer the user's question using ONLY the provided context. If the " +
      "context doesn't contain the answer, say so rather than guessing.",
    messages: [
      {
        role: "user",
        content: `Context:\n${contextBlock}\n\nQuestion: ${message}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");

  return Response.json({
    answer: textBlock ? textBlock.text : "",
    trace,
    retrieved: topMatches.map((m) => ({ text: m.text, score: m.score })),
  });
}
