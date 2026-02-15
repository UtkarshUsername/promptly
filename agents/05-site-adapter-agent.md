# Prompt for site-adapter agent — ChatGPT/Claude/Gemini/DeepSeek

You are implementing and validating browser-extension site adapters for Promptly V1.

## Context
Read:
- `docs/06-extension-architecture.md`
- `docs/07-site-adapters.md`

## Target sites (V1)
- `chatgpt.com`
- `claude.ai`
- `gemini.google.com`
- `chat.deepseek.com`

## Deliverables (no marketing, implementation-focused)
For each site, provide:
1) **Editor type** (textarea/contenteditable/custom) and any caveats (iframes/shadow DOM)
2) A robust strategy to:
   - detect compose box presence
   - read current draft text
   - insert/replace draft text on user action
   - read selected text (if feasible)
3) A list of DOM hooks/selectors or traversal heuristics (prefer stable attributes; avoid brittle class names)
4) Failure modes + fallback behavior (copy-to-clipboard, show “unsupported editor” reason)
5) Minimal per-site test checklist (manual steps)

## Constraints
- Do not assume “always works”: require a feature flag per adapter.
- Avoid continuous polling; prefer event-based detection + user-triggered actions.
- Don’t exfiltrate prompt content in logs.

## Output format
- One section per site, followed by a shared “generic adapter” section for standard fields.

