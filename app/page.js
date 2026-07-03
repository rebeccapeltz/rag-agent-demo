"use client";

import { useState } from "react";
import AgentTab from "./components/AgentTab";
import RagTab from "./components/RagTab";
import PasscodeGate from "./components/PasscodeGate";

export default function Home() {
  const [tab, setTab] = useState("agent");
  const [nomen, setNomen] = useState(null); // held in memory only, for this tab/session

  if (!nomen) {
    return <PasscodeGate onUnlock={setNomen} />;
  }

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Agents Course · Live Demo</p>
        <h1>Two ways an agent reaches beyond its own training</h1>
        <p className="subhead">
          One calls a tool to fetch live data it couldn&apos;t otherwise know.
          The other retrieves its own notes before answering. Watch the trace
          on the right to see each step as it happens.
        </p>
      </header>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "agent"}
          className={`tab ${tab === "agent" ? "active" : ""}`}
          onClick={() => setTab("agent")}
        >
          Quote Agent — Tool Calling
        </button>
        <button
          role="tab"
          aria-selected={tab === "rag"}
          className={`tab ${tab === "rag" ? "active" : ""}`}
          onClick={() => setTab("rag")}
        >
          RAG — Retrieval
        </button>
      </div>

      {tab === "agent" ? <AgentTab nomen={nomen} /> : <RagTab nomen={nomen} />}
    </main>
  );
}
