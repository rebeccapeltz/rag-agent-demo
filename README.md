# Agent & RAG Demos

A web-hosted version of the two LM Studio classroom demos, rebuilt to run on
Claude's API instead of a locally loaded model. Students visit a URL — no
installs, no local model downloads, no LM Studio setup required.

**Tab 1 — Quote Agent (tool calling).** Claude decides whether it needs to
call `get_random_quote()`, the server actually runs it against
dummyjson.com, and Claude writes the final answer using the real result.

**Tab 2 — RAG (retrieval).** A small built-in knowledge base about local AI
concepts is scored with TF-IDF against the question, the top 3 matches are
injected into the prompt as context, and Claude answers from that context.

Both tabs show a live **Trace** panel so students can see each step of the
process, not just the final answer.

## Architecture

Same proxy pattern as the dashboard demo: a Next.js API route runs on the
server and holds the Anthropic API key. The browser never sees the key —
it only ever talks to `/api/agent` and `/api/rag` on your own domain.

```
Browser  --fetch-->  /api/agent or /api/rag (Vercel serverless)  --Anthropic SDK-->  Claude API
```

## Local setup

```bash
npm install
cp .env.local.example .env.local
# then edit .env.local and paste in your Anthropic API key
npm run dev
```

Visit `http://localhost:3000`.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel, "Add New Project" → import that repo. Framework preset
   (Next.js) is detected automatically.
3. Under **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` — your key from the Anthropic Console
   - `CLAUDE_MODEL` — optional, defaults to `claude-haiku-4-5-20251001`
   - `NOMEN_KEY` — the shared classroom passcode students enter before the
     app lets them send a message. Same lightweight gate pattern as the
     dashboard demo — not per-user auth, just keeps the URL from being wide
     open to anyone who stumbles on it.
4. Deploy. You'll get a public `*.vercel.app` URL to share with students —
   nothing for them to install.

## Classroom cost notes

- Haiku is the default model specifically because it's the cheapest/fastest
  option and this is a 50-student classroom tool, not a quality benchmark.
  Swap `CLAUDE_MODEL` to a stronger model temporarily if you want to demo
  the quality/cost tradeoff live.
- Every message triggers at least one API call (two for the agent tab, when
  the tool gets used). At classroom scale this stays cheap, but if you want
  a hard ceiling, set usage limits/alerts on the API key in the Anthropic
  Console rather than relying on self-restraint from 50 students at once.
- The `.env.local` file is git-ignored — never commit your real key. If you
  hand this repo to students to fork for their own experiments, make sure
  they each use their own key rather than yours.

## Where this differs from the local LM Studio version

- **Retrieval**: the local Python script used `sentence-transformers` for
  true semantic embeddings. This version uses a dependency-free TF-IDF
  implementation (`lib/tfidf.js`) instead, since a neural embedding model
  doesn't run well in a serverless function. TF-IDF matches on shared
  vocabulary rather than meaning — worth naming out loud in class, since
  it's a real limitation, not just an implementation detail. A question
  that rephrases every word differently from the source text will retrieve
  worse here than it did locally.
- **Model**: Claude via the Anthropic API, not a locally quantized Gemma
  model — so there's nothing to say here about GGUF, quantization, or
  context window limits imposed by local hardware. That contrast is
  itself worth pointing out if you're teaching both versions back to back.


## Run Next.js Locally

```bash
 npm install
 npm approve-scripts sharp@0.34.5
 npm approve-scripts sharp
 cp .env.local.example .env.local
 npm run dev
  ````