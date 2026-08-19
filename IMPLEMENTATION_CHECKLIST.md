# Implementation Checklist

Work top to bottom. Do not start a phase until the previous one is fully checked and verified
against a real running Ollama daemon.

Legend: `[x]` done · `[ ]` todo · `[~]` in progress

---

## Phase 0 — Foundation ✅

- [x] Git repo initialized
- [x] `CLAUDE.md` — working agreement for AI-assisted changes
- [x] `PROJECT_SPECS.md` — spec + architecture diagrams
- [x] `IMPLEMENTATION_CHECKLIST.md` — this file
- [x] Next.js 15 + TypeScript strict scaffold
- [x] Tailwind v4 with CSS-first theme tokens
- [x] shadcn-style UI primitives (button, dialog, select, card, badge, progress, scroll-area)
- [x] `lib/utils.ts` with `cn()`
- [x] `.gitignore`, `.env.example`
- [ ] **You run:** `npm install` then `npm run dev` — confirm the app boots at localhost:3000

---

## Phase 1 — V1: Chat + resource management ✅ (built, pending your live verification)

### 1.1 Ollama client layer

- [x] `lib/ollama.ts` — base URL from `OLLAMA_HOST`, `127.0.0.1` fallback, typed helpers
- [x] `lib/types.ts` — `ChatMessage`, `InstalledModel`, `RunningModel`, `ChatStats`
- [x] `lib/format.ts` — bytes, duration, countdown, tokens/sec formatters
- [x] `lib/catalog.ts` — curated open-source models available to pull
- [x] Uniform error shape `{ error: string }` + real HTTP status on every route

### 1.2 API routes

- [x] `GET  /api/ollama/version` — daemon health
- [x] `GET  /api/ollama/tags` — installed models
- [x] `GET  /api/ollama/ps` — loaded models with derived VRAM/CPU split
- [x] `POST /api/ollama/pull` — streaming download progress
- [x] `POST /api/ollama/chat` — streaming chat completion
- [x] `POST /api/ollama/unload` — free memory via `keep_alive: 0`
- [x] `POST /api/ollama/delete` — remove weights from disk

### 1.3 Chat UI

- [x] App shell: header + chat column + resource sidebar
- [x] `ModelSelect` — installed models with param size / quant / disk size
- [x] "Pull a new model…" entry point in the dropdown
- [x] `PullModelDialog` — curated catalog + manual `name:tag` entry
- [x] Pull progress bar with status text, percent, and transferred/total
- [x] `useChat` — message state, NDJSON stream reader, partial-line buffering
- [x] `MessageList` / `MessageBubble` with streaming cursor
- [x] Stop-generation button (`AbortController`), keeps partial output
- [x] Per-response stats footer: tok/s, duration, token counts
- [x] "New chat" reset
- [x] Empty state when no models are installed
- [x] Enter to send, Shift+Enter for newline, auto-growing textarea

### 1.4 Resource panel (`ollama ps`)

- [x] `useOllamaPs` — 3s polling, pauses when the tab is hidden
- [x] Running-model rows: total resident, GPU/CPU split bar, percent on GPU
- [x] Auto-eviction countdown from `expires_at`
- [x] `[Unload]` per running model → instant refresh
- [x] Installed-model list with disk size
- [x] `[Delete]` per installed model behind a confirmation dialog
- [x] Total resident memory footer
- [x] "Nothing loaded" empty state

### 1.5 Resilience

- [x] Daemon-status pill in the header
- [x] Full-screen offline state with the `ollama serve` fix command
- [x] Stream errors surface inline instead of throwing
- [x] Pull and chat both cancellable

### 1.6 Your verification pass

- [ ] `npm run build` passes on your machine
- [ ] Pull a small model (`llama3.2:3b`) from the dialog end to end
- [ ] Chat streams tokens; stop button halts mid-response
- [ ] Resource panel shows the model within ~3s of the first message
- [ ] `[Unload]` removes it from the panel and frees memory (cross-check with `ollama ps`)
- [ ] `[Delete]` removes it from disk (cross-check with `ollama list`)
- [ ] Quit Ollama → app shows the offline state instead of crashing
- [ ] Restart Ollama → app recovers without a page reload

---

## Phase 2 — V2: Model arena 🔜

Do not start until every box in Phase 1 is checked.

### 2.1 Storage

- [ ] Add `better-sqlite3`, create `data/kuma.db` (gitignored)
- [ ] Schema: `run(id, prompt, mode, created_at)`,
      `response(id, run_id, slot, model, content, stats_json)`,
      `score(id, run_id, source, winner, rubric_json, created_at)`
- [ ] `lib/db.ts` — migrations on boot, typed query helpers

### 2.2 Dual execution

- [ ] `POST /api/arena/run` — accepts `{ prompt, modelA, modelB, mode }`
- [ ] Sequential mode (default): A fully, then B
- [ ] Parallel mode (opt-in) with a VRAM warning
- [ ] Multiplexed stream: every line tagged `{ slot: "a" | "b" }`
- [ ] Persist both responses + per-model stats on completion

### 2.3 Arena UI (`/arena`)

- [ ] Prompt box + two model selectors (reuse `ModelSelect`)
- [ ] Execution-mode toggle with the VRAM caveat inline
- [ ] Side-by-side streaming panes, randomized left/right
- [ ] Blinded labels ("Model A" / "Model B") until a vote lands
- [ ] Per-pane stats footer (tok/s, duration, resident memory)
- [ ] Vote bar: A better · B better · Tie · Both bad
- [ ] Reveal identities after voting

### 2.4 LLM-as-judge

- [ ] Judge-model selector, excludes both contestants
- [ ] Rubric prompt → strict JSON: correctness, instruction-following, completeness,
      conciseness (1–5 each) + justification
- [ ] `POST /api/arena/judge`; retry once on malformed JSON, then fail visibly
- [ ] Render judge scores next to the human vote; never overwrite a human verdict

### 2.5 Results

- [ ] `/arena/history` — past runs, filter by model pair
- [ ] `/leaderboard` — win rate, Elo (K=32), median tok/s, sample size per model
- [ ] Always display n next to any rating
- [ ] Export runs to CSV

---

## Phase 3 — V3: Chat quality of life

- [ ] Markdown rendering + code syntax highlighting + copy-code button
- [ ] System prompt editor per conversation
- [ ] Sampling controls: temperature, top_p, num_ctx, seed
- [ ] Conversation persistence (SQLite, reusing the Phase 2 store)
- [ ] Multi-conversation sidebar with rename and delete
- [ ] Regenerate response / edit-and-resend
- [ ] Export conversation to markdown

## Phase 4 — V4: Benchmark suites

- [ ] Saved prompt sets
- [ ] Unattended run of a suite across N models
- [ ] Aggregate scoring per suite
- [ ] CSV export + regression tracking across model versions

## Phase 5 — V5: Hardware telemetry

- [ ] Sampled VRAM/RAM/CPU history sparkline
- [ ] Per-model load-time history
- [ ] Pre-pull "will this fit in your VRAM?" estimate
- [ ] Cold-start vs warm-start latency breakdown

---

## Backlog (unscheduled)

- [ ] Keyboard shortcuts (`⌘K` model switcher, `⌘N` new chat)
- [ ] Light theme
- [ ] Vision-model image input
- [ ] Ollama Modelfile editor for custom system prompts
- [ ] Multi-host support (point at a second machine's Ollama)
