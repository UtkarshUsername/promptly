# Architecture (proposed) — plain language

## The simplest shippable approach
V1 is a **browser extension** with two stages of feedback:

1) **Rules engine (fast, deterministic)**
   - Checks for common prompt issues (missing goal, missing constraints, vague terms, no output format).
   - Produces a structured list of suggestions with severity and “why it matters”.

2) **LLM assist (optional, higher quality)**
   - Takes the user prompt + the rule findings.
   - Produces:
     - an improved prompt rewrite
     - optional variants (“short”, “strict JSON”, “more creative”)
   - In V1 this runs via **OpenRouter BYOK** (user supplies their own API key).

## Data & privacy
- Default: do not store prompts outside the user’s device.
- History (optional): store only with explicit opt-in, and show a clear setting.
  - Recommended V1 storage: **local extension storage** (and optionally browser sync later).

## Why not “all-LLM”?
- It’s slower, more expensive, and harder to make consistent.
- Rules give predictable, teachable feedback; the LLM adds polish and rewrite quality.

## Components (conceptual)
- UI: side panel/popup editor + suggestions + improved prompt
- Content script: reads selection/focused field where possible; inserts improved text on request
- Lint engine: local rules + scoring (runs locally)
- Rewrite engine: OpenRouter client (runs in background/service worker to protect key)
- Telemetry (optional): anonymous event counts, no prompt contents

## Key risks and mitigations
- Hallucinated or generic rewrites → constrain with rubric + pass through user intent + preserve constraints.
- User confusion → keep suggestions short, show examples, provide 1-click apply.
- Inline “any field” expectation → ship coverage levels; add site adapters over time.
- BYOK friction → add simple setup, key validation, and a “rules-only mode” without an API key.
