# Site adapters (V1)

## Why adapters exist
“Inline in any text field” isn’t one feature; it’s a long-term compatibility program. Each major app uses a different editor implementation and interaction model, so we ship **site adapters** that translate between Promptly and a specific site’s compose box.

## V1 target sites (initial)
- `chatgpt.com`
- `claude.ai`
- `gemini.google.com`
- `chat.deepseek.com`

## Coverage promise (what we say publicly)
- Works everywhere via **side panel** (copy/insert).
- Inline button + insert works on supported sites and standard fields.
- If inline insert fails, Promptly falls back to copy-to-clipboard and highlights why (“This editor blocks programmatic insertion”).

## Adapter interface (conceptual)
Each adapter implements:
- **Detect**: “Am I on this site?” + “Is the compose editor present?”
- **Read**: get current prompt text (best-effort)
- **Write**: insert/replace prompt text (user-triggered)
- **Selection** (optional): read selected text in the editor (for partial improvements)
- **Health**: report supported/unsupported states with reasons

## Rollout strategy
1) Build a **generic adapter** for standard `input/textarea` and simple `contenteditable`.
2) Add one site adapter at a time behind a feature flag.
3) Track failure modes locally (no prompt content) to guide fixes.

## Compatibility principles
- Only read/write on explicit user action (button press / shortcut).
- Prefer minimal DOM interaction: don’t continuously scrape.
- Keep permissions minimal; be transparent in onboarding.

## Definition of “supported” (for V1)
Supported if we can reliably:
- open Promptly on the page
- capture either selection or full draft text
- insert improved prompt back into the compose box

