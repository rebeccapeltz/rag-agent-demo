"use client";

import { useState } from "react";

export default function PasscodeGate({ onUnlock }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim() || checking) return;
    setChecking(true);
    setError(false);

    // Verify by making a harmless probe request against the agent route —
    // it checks the passcode before doing anything else, so a 401 here
    // means the passcode was wrong without spending a real Claude call.
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "", nomen: value.trim() }),
      });
      if (res.status === 401) {
        setError(true);
        setChecking(false);
        return;
      }
      onUnlock(value.trim());
    } catch (err) {
      setError(true);
      setChecking(false);
    }
  }

  return (
    <main className="page">
      <div className="gate">
        <p className="eyebrow">Agents Course · Live Demo</p>
        <h1 className="gate-title">Enter the classroom passcode</h1>
        <p className="subhead">Ask your instructor if you don&apos;t have it.</p>
        <form onSubmit={handleSubmit} className="gate-form">
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Passcode"
            aria-label="Passcode"
            autoFocus
          />
          <button type="submit" disabled={checking}>
            {checking ? "Checking…" : "Enter"}
          </button>
        </form>
        {error && <p className="gate-error">That passcode didn&apos;t work — try again.</p>}
      </div>
    </main>
  );
}
