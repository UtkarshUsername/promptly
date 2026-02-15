# PRD — Promptly V1

## One-sentence product definition
Promptly helps you turn a rough prompt into a high-quality prompt by diagnosing gaps and offering concrete improvements and optional rewrites.

## Target user (fill in)
- Primary persona:
- Top 3 jobs-to-be-done:
  1.
  2.
  3.

## V1 scope (what we will ship)
### Surface: browser extension (V1)
We ship Promptly primarily as a **browser extension** that feels Grammarly-like.

V1 supports:
- A **side panel / popup editor** experience (works on any site)
- **Inline assistance (limited)** for standard fields (`input`, `textarea`, simple `contenteditable`)

### Core flow
1) User opens Promptly via toolbar button / keyboard shortcut / context menu
2) Promptly captures prompt text via:
   - current selection (preferred), or
   - currently focused field (when accessible), or
   - paste into the panel
3) User selects intent (optional): “write”, “analyze”, “summarize”, “code”, “brainstorm”, “other”
4) Promptly returns:
   - Issues & suggestions (ranked)
   - A “better prompt” rewrite (LLM-assisted)
   - Optional: output-format scaffolding (bullets / JSON schema / rubric)
5) User copies or inserts the improved prompt back into the page

### Suggestion categories (V1)
- Goal clarity: what result do you want?
- Context: background + constraints + audience
- Inputs: what data the model should use
- Output format: structure, length, tone, schema
- Examples: positive/negative examples (optional)
- Verification: ask model to check assumptions / cite sources / show work (as appropriate)

### Non-goals (explicitly not V1)
- Autocomplete everywhere on the web (full Grammarly parity)
- Deep prompt memory / personalization
- Enterprise compliance workflows

## UX requirements
- Must feel fast: first feedback < 2 seconds (rules) / < 6 seconds (LLM) where possible
- Clear language: suggestions written for non-experts
- Confidence indicators: “High impact / Medium / Low”

## Technical requirements (high level)
- Modular “lint rules” system (deterministic checks)
- LLM “critic + rewriter” step (OpenRouter BYOK)
- Prompt retention: off by default; optional history with explicit opt-in

## Metrics
- Activation: % users who copy improved prompt
- Engagement: prompts analyzed per user per week
- Quality proxy: thumbs up/down on suggestions

## Open questions (decision points)
- Coverage level for inline support (side panel only vs limited inline vs site adapters)
- Which browsers for V1 launch (Chrome-only vs Chrome+Firefox, etc.)
- OpenRouter BYOK UX (bring key, choose model, set limits)
- Where history is stored (local-only vs cloud sync)
- Monetization is **out of scope for V1** (free while BYOK); revisit when we offer hosted LLM usage.
- Which site adapters ship in V1 (initial list: ChatGPT, Claude, Gemini, DeepSeek chat)
