"use client";

import { useState } from "react";

export default function RagTab({ nomen }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [trace, setTrace] = useState([]);
  const [retrieved, setRetrieved] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setLoading(true);
    setTrace([]);
    setRetrieved([]);

    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, nomen }),
      });
      if (res.status === 401) {
        setMessages((m) => [...m, { role: "assistant", content: "Session expired — refresh and re-enter the passcode." }]);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: `Server error: ${data.detail || data.error || "unknown"}` }]);
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: data.answer || "(no answer)" }]);
      setTrace(data.trace || []);
      setRetrieved(data.retrieved || []);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: `Request failed: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="demo-grid">
      <div className="panel chat-panel">
        <div className="chat-log">
          {messages.length === 0 && (
            <p className="empty-hint">
              Ask about local AI concepts — quantization, embeddings, tool
              calling, context windows…
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              <span className="bubble-role">{m.role === "user" ? "You" : "Agent"}</span>
              <p>{m.content}</p>
            </div>
          ))}
          {loading && <div className="bubble assistant pending">Retrieving…</div>}
        </div>
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a local AI concept…"
            aria-label="Message"
          />
          <button type="submit" disabled={loading}>
            Send
          </button>
        </form>
      </div>

      <aside className="panel trace-panel">
        <h2>Trace</h2>
        {trace.length === 0 ? (
          <p className="empty-hint">Steps will appear here once you ask something.</p>
        ) : (
          <ol className="trace-log">
            {trace.map((step, i) => (
              <li key={i}>
                <span className="trace-index">{String(i + 1).padStart(2, "0")}</span>
                <span className="trace-text">{step}</span>
              </li>
            ))}
          </ol>
        )}

        {retrieved.length > 0 && (
          <>
            <h2>Retrieved context</h2>
            <ul className="retrieved-log">
              {retrieved.map((r, i) => (
                <li key={i}>
                  <span className="score">score {r.score.toFixed(3)}</span>
                  <span className="chunk">{r.text}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </section>
  );
}
