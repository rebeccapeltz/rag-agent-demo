"use client";

import { useState } from "react";

export default function AgentTab({ nomen }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [trace, setTrace] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setLoading(true);
    setTrace([]);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, nomen }),
      });
      if (res.status === 401) {
        setMessages((m) => [...m, { role: "assistant", content: "Session expired — refresh and re-enter the passcode." }]);
        return;
      }
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.answer || "(no answer)" }]);
      setTrace(data.trace || []);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: "Something went wrong reaching the agent." }]);
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
              Ask for a quote, then ask something that doesn&apos;t need one — like
              &ldquo;what&apos;s 2+2?&rdquo; — and compare the trace.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              <span className="bubble-role">{m.role === "user" ? "You" : "Agent"}</span>
              <p>{m.content}</p>
            </div>
          ))}
          {loading && <div className="bubble assistant pending">Thinking…</div>}
        </div>
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent something…"
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
      </aside>
    </section>
  );
}
