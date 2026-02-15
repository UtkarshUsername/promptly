# Promptly
Grammarly-style feedback for prompt engineering: analyze a prompt, explain what’s missing, and suggest improvements (with optional rewrites) to get better LLM outputs.

## What is implemented
- Chromium extension (Manifest V3) with:
  - `sidepanel` editor (capture, analyze, suggestions, rewrite, diff, copy/insert)
  - `popup` quick actions (capture/open panel/save draft)
  - `options` page (OpenRouter BYOK, privacy/history, site toggles)
- Local deterministic lint engine with 20 V1 rules and 0-100 prompt health scoring.
- Optional OpenRouter rewrite flow via background service worker.
- Local history (opt-in only, stored in extension storage).
- Site adapter support for:
  - `chatgpt.com`
  - `claude.ai`
  - `gemini.google.com`
  - `chat.deepseek.com`
  - generic fallback for `input`, `textarea`, and simple `contenteditable`.

## Repository docs
- `docs/01-discovery.md` — questions + assumptions to validate
- `docs/02-prd-v1.md` — V1 spec (what we’re building first)
- `docs/03-architecture.md` — proposed technical approach (plain language)
- `docs/04-backlog.md` — prioritized backlog + milestones
- `docs/08-ux-spec-v1.md` — UX deliverables (IA, components, microcopy, a11y)
- `docs/09-rule-engine-v1.md` — JSON schemas + first 20 lint rules
- `docs/10-llm-rubric-v1.md` — critic/rewriter system prompts and response schema

## Run the extension locally
1. Open `chrome://extensions` in Chrome/Edge/Brave.
2. Enable `Developer mode`.
3. Click `Load unpacked` and select the `extension/` folder.
4. Pin Promptly from the extensions toolbar.
5. Open Promptly popup, then side panel.

## Configure OpenRouter (optional)
1. Open extension settings (`Options`).
2. Paste your OpenRouter API key.
3. Set a model id (default: `openai/gpt-4o-mini`).
4. Disable `Rules-only mode` to enable rewrite generation.

If no API key is set, Promptly still works in deterministic rules-only mode.

## Tests
Run:
```bash
npm test
```

The test suite validates core rules-engine behavior in `tests/rules-engine.test.mjs`.
