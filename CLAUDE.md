# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this project is

**kumaUI** is a local-first web UI for open-source LLMs served by [Ollama](https://ollama.com).
Everything runs on the user's machine. No cloud model providers, no API keys, no telemetry.

Two headline capabilities, built in phases:

1. **Chat** (V1 — built) — pick a model from a dropdown, pull it if it isn't installed, chat with
   streaming responses, and watch/manage hardware usage via an `ollama ps` panel.
2. **Arena** (V2+ — planned) — send one prompt to two models simultaneously, compare responses
   side by side, and score which one is better (human vote first, LLM-as-judge after).

## Core principles

- **Local only.** The only backend dependency is the Ollama daemon at `http://127.0.0.1:11434`.
  Never add a hosted inference provider, analytics SDK, or auth service.
- **Build slowly.** Ship one vertical slice at a time. Do not start V2 work while V1 items in
  `IMPLEMENTATION_CHECKLIST.md` are unchecked. Update the checklist as part of the same change.
- **Server proxies Ollama.** The browser never talks to `:11434` directly. All calls go through
  `src/app/api/ollama/*` route handlers. This avoids CORS/`OLLAMA_ORIGINS` config and keeps a
  single place to add timeouts, error shaping, and (later) request logging.
- **Stream everything long-running.** Chat and model pulls stream NDJSON from Ollama and are
  re-streamed to the browser. Never buffer a full generation before rendering.
- **Degrade honestly.** If Ollama is not running, say so plainly in the UI with the command to
  fix it. Never fake a response or silently swallow a fetch error.

## Commands

```bash
npm install          # install deps
npm run dev          # dev server on http://localhost:3000
npm run build        # production build (also the typecheck gate)
npm start            # serve the production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
```

Ollama must be running separately:

```bash
ollama serve         # or just launch the Ollama app
ollama pull llama3.2:3b
ollama ps            # what the resource panel mirrors
```

## Architecture map

```
src/
  app/
    layout.tsx                     root layout, fonts, dark theme
    page.tsx                       single-screen shell: chat + resource sidebar
    api/ollama/
      version/route.ts             GET   health check for the daemon
      tags/route.ts                GET   installed models  -> /api/tags
      ps/route.ts                  GET   loaded models     -> /api/ps
      pull/route.ts                POST  stream a model download -> /api/pull
      chat/route.ts                POST  stream a chat completion -> /api/chat
      unload/route.ts              POST  evict from memory -> /api/generate keep_alive:0
      delete/route.ts              POST  remove from disk  -> DELETE /api/delete
  components/
    chat/                          ChatPanel, MessageList, MessageBubble, ChatInput
    models/                        ModelSelect, PullModelDialog
    resources/                     ResourcePanel, RunningModelRow
    ui/                            shadcn-style primitives (button, dialog, select, ...)
  hooks/
    useModels.ts                   installed models + refresh
    useOllamaPs.ts                 polls /api/ollama/ps every 3s
    useChat.ts                     message state + streaming fetch
  lib/
    ollama.ts                      server-side Ollama client + typed responses
    catalog.ts                     curated list of pullable open-source models
    format.ts                      bytes / duration / tok-per-sec formatters
    types.ts                       shared types
```

## Conventions

- **TypeScript strict.** No `any` in committed code; use `unknown` + a narrowing guard.
- **Server-only Ollama access.** `lib/ollama.ts` must never be imported into a `"use client"`
  file. Client code calls `/api/ollama/*` with `fetch`.
- **Route handlers** live at `src/app/api/ollama/<verb>/route.ts`, export named HTTP methods, and
  set `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"`.
- **Streaming responses** return `text/event-stream`-ish NDJSON: one JSON object per line,
  `\n`-delimited. Clients parse with the shared reader loop pattern in `hooks/useChat.ts`.
- **Errors** are returned as `{ error: string }` with a real HTTP status. UI surfaces the string.
- **Styling**: Tailwind v4 (CSS-first config in `globals.css`, no `tailwind.config.ts`).
  Design tokens are CSS variables under `@theme`. Use `cn()` from `lib/utils.ts` to merge classes.
- **Components** are function declarations, props typed inline or via a local `Props` type.
  Client components carry `"use client"` at the top; everything else stays a server component.
- **No state library.** React state + hooks only until it genuinely hurts.

## Model naming

Ollama identifies models as `name:tag` (e.g. `llama3.2:3b`, `qwen2.5-coder:7b`). Always keep the
tag. `llama3.2` and `llama3.2:3b` are different strings to the API even when they resolve to the
same digest — dedupe on `digest`, display `name`.

## Gotchas

- `ollama ps` returns `size` (total) and `size_vram` (GPU portion). CPU/RAM portion is
  `size - size_vram`. A model with `size_vram === 0` is running fully on CPU and will be slow.
- **Unload ≠ delete.** Unload (`keep_alive: 0`) frees RAM/VRAM but keeps the weights on disk;
  the model reloads on next use. Delete removes the blob from disk and requires a re-pull.
  The UI must make this distinction obvious and confirm before delete.
- `expires_at` in `/api/ps` is when Ollama will auto-evict (default 5 min idle).
- Pull progress lines have `total`/`completed` only during layer downloads; other lines are
  status-only (`"verifying sha256 digest"`). Guard before dividing.
- Next.js buffers responses unless you return a `ReadableStream` and avoid `await res.text()`.
  Pass the upstream `res.body` through directly.
- Ollama may be at a non-default host. Read it from `OLLAMA_HOST` env with a
  `http://127.0.0.1:11434` fallback. Prefer `127.0.0.1` over `localhost` — Node 18+ resolves
  `localhost` to IPv6 `::1` first, which Ollama may not be listening on.

## Definition of done for any change

1. `npm run build` passes.
2. Tested against a real running Ollama daemon, not mocks.
3. Tested with Ollama **stopped** — the UI shows the offline state instead of crashing.
4. The relevant box in `IMPLEMENTATION_CHECKLIST.md` is checked.
5. `PROJECT_SPECS.md` updated if the architecture or API surface changed.
