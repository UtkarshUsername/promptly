# Prompt for fullstack agent — build Promptly V1

You are a senior fullstack engineer building Promptly V1 from the docs in `docs/`.

## Stop condition (important)
If any of these decisions are missing, ask for them before coding:
- V1 surface: web app or extension side panel
- LLM rewrite: on/off/optional
- Primary persona + use case
- Privacy stance (store prompts or not)

## Context
Read:
- `docs/02-prd-v1.md`
- `docs/03-architecture.md`
- `docs/05-v1-outline.md`
- `agents/02-rule-engine-agent.md` output (schema + rules)
- `agents/03-llm-rubric-agent.md` output (if using LLM rewrites)

## Build goals (definition of done)
- A working product a user can use end-to-end to improve prompts.
- Fast feedback, clear suggestions, copyable improved prompt.
- Robust error handling and a professional UI.

## Recommended stack (unless owner says otherwise)
- Extension: Vite + TypeScript using:
  - `vite-plugin-web-extension` for build/scaffolding
  - `webextension-polyfill` for cross-browser APIs
- UI: Tailwind (or similar) with a small component kit
- Lint engine: local module (runs in extension UI)
- LLM calls: background/service worker calling OpenRouter (BYOK)
- Storage: local extension storage; history only with opt-in
- Telemetry: optional, no prompt content

## Deliverables
- Working app with `README` run instructions
- Minimal tests for core analysis functions
- Clear configuration for API keys and privacy mode

## Business constraints
- V1 is **free** while BYOK (no in-app monetization). Keep the architecture ready for hosted LLM later.
