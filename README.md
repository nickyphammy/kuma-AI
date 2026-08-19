# kumaUI

A local-first chat UI for open-source LLMs, powered by [Ollama](https://ollama.com).
Everything — models, prompts, responses — stays on your machine.

**V1 (current):** streaming chat, a dropdown of installed models, a catalog to pull new ones, and
a live `ollama ps` panel showing exactly what's eating your VRAM/RAM, with unload and delete.

**V2 (planned):** run one prompt against two models side by side and score which answer is better.

## Setup

**1. Install and start Ollama**

```bash
# macOS
brew install ollama
ollama serve          # or launch the Ollama desktop app
```

**2. Install and run kumaUI**

```bash
npm install
npm run dev
```

Open http://localhost:3000.

**3. Pull your first model**

Use the model dropdown → "Pull a new model…" and grab `llama3.2:3b` (~2 GB). Or from the terminal:

```bash
ollama pull llama3.2:3b
```

## Using it

- **Model dropdown** — every installed model with its parameter count, quantization, and disk size.
- **Pull dialog** — a curated catalog (Llama, Qwen, Gemma, Mistral, Phi, DeepSeek-R1, coder
  variants) with live download progress, plus a field for any `name:tag` you want.
- **Chat** — tokens stream in; the stop button halts generation and keeps the partial output.
  Each response footers with tok/s, duration, and token counts.
- **Resource panel** — mirrors `ollama ps` every 3 seconds. Shows resident memory, the GPU/RAM
  split (a fully-CPU model gets flagged, since it'll be slow), and a countdown to auto-eviction.
  - **Unload** frees memory now; the weights stay on disk and reload on next use.
  - **Delete** removes the weights from disk and needs a re-pull. Confirmed before it runs.

Chat history is in-memory only in V1 — a refresh clears it. That's deliberate; persistence lands
with the V2 arena store.

## Configuration

Copy `.env.example` to `.env.local` if Ollama isn't at the default address.

| Variable | Default |
|---|---|
| `OLLAMA_HOST` | `http://127.0.0.1:11434` |
| `OLLAMA_TIMEOUT_MS` | `600000` |

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build (doubles as the typecheck gate)
npm start          # serve the build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## Project docs

- [`PROJECT_SPECS.md`](./PROJECT_SPECS.md) — architecture diagrams, API surface, roadmap
- [`IMPLEMENTATION_CHECKLIST.md`](./IMPLEMENTATION_CHECKLIST.md) — phase-by-phase build order
- [`CLAUDE.md`](./CLAUDE.md) — conventions and gotchas for AI-assisted work

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind v4 · Radix primitives · Ollama HTTP API.
No cloud providers, no API keys, no telemetry.
