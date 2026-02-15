# Discovery — what we’re actually building

## The core bet (hypothesis)
People lose time and quality because they *think* their prompt is clear, but it’s missing key ingredients (goal, context, constraints, format, examples). Promptly catches those gaps and suggests fixes quickly.

## What I’m pushing back on (to keep V1 shippable)
- “Grammarly but for all prompts everywhere” is *too big* for V1 (extension + cross-site UI + many prompt types + personalization).
- The fastest path to value is a **prompt editor** that provides **lint + suggestions + rewrite**, then later becomes an extension.

## 7 questions I need you to answer (high leverage)
1) Primary user: who is this for on day 1?
   - (A) non-technical ChatGPT users  (B) marketers/content  (C) analysts  (D) engineers  (E) teams
2) Primary surface for V1:
   - (A) web app (paste prompt)  (B) Chrome extension (side panel)  (C) both
3) “Best practices” target: which prompting style do we optimize for?
   - (A) general LLM  (B) tool-using agents  (C) structured outputs (JSON)  (D) RAG prompts  (E) custom
4) What’s the V1 output you’d be proud to show?
   - (A) score + checklist  (B) inline suggestions  (C) one-click rewrite  (D) all three
5) Do we send prompts to an LLM API in V1?
   - (A) yes (better suggestions)  (B) no (rules-only)  (C) optional toggle
6) Privacy stance:
   - (A) we never store prompts  (B) we store with consent for history  (C) enterprise later
7) Monetization in the first 60 days:
   - (A) free only  (B) freemium (limits)  (C) paid from day 1

## Final decisions (locked Feb 15, 2026)
- Persona: **Individual AI chat users in marketing/content and knowledge work** who iterate prompts daily and care about speed + quality.
- V1 surface: **Extension** (Chrome-first side panel + popup).
- Prompting style focus: **General LLM prompts**, with structured-output support when users request JSON/table/rubric formats.
- Output: **D** (score + checklist + one-click rewrite).
- LLM API: **A** (OpenRouter BYOK) with a rules-only fallback when no key is configured.
- Privacy: **B** (store prompts only with explicit opt-in; default off).
- Monetization: **A** (free for V1 while BYOK).
- Coverage level: **Level 2** for launch targets (`chatgpt.com`, `claude.ai`, `gemini.google.com`, `chat.deepseek.com`) with **Level 1 fallback** on unsupported editors.
- Browser support at launch: **Chromium browsers** (Chrome/Edge/Brave) via MV3; Firefox support moves to post-V1.
- Score display: **Numeric 0-100 Prompt Health score plus qualitative label** (Strong/Fair/Needs work).

## Success criteria (pick 1–2)
- (S1) Users paste a prompt, accept ≥1 suggestion, and report better output.
- (S2) Repeat usage: user returns 3+ times in a week.
- (S3) Conversion: email waitlist or paid plan interest.

## Pushback: “works in any text field”
This is the hardest part of Grammarly’s product. Basic `textarea`/`input` and some `contenteditable` fields are feasible, but many high-usage apps (Google Docs, Notion, Slack, etc.) use complex editors with custom DOM, iframes, shadow DOM, and heavy keyboard handling. “Inline underlines + apply-in-place” will require **site adapters** and ongoing maintenance.

### Smarter starting point (still feels like an extension)
Ship an extension that works great in two ways:
1) **Side panel / popup editor** that can analyze:
   - selected text, or
   - text from the currently focused field (where accessible), or
   - copy/paste
2) **Inline mode (limited)** for standard fields only, with clear “Supported fields” messaging.

## Must-have vs later (my recommendation)
### Must-have for V1
- Prompt analysis (clear, actionable)
- Suggestions categorized (missing context, ambiguity, format, constraints)
- “Improved prompt” draft (rewrite) + diff-like view
- Copy-to-clipboard + shareable link (optional)

### Add later
- Full Grammarly-style inline editing across sites
- Team libraries, prompt versioning, approvals
- Model-specific tuning and per-role templates
- A/B testing prompts, analytics dashboards

## Coverage decision
Chosen **Coverage Level 2** for launch:
- **Level 1 (Recommended):** Side panel works everywhere + inline only for `input/textarea` + simple `contenteditable`.
- **Level 2:** Add 2–3 “site adapters” (e.g., ChatGPT + Google Docs + Notion).
- **Level 3:** “Any field” ambition (ongoing, expensive).

## Your initial target sites (Feb 15, 2026)
- `chatgpt.com`
- `claude.ai`
- `gemini.google.com`
- `chat.deepseek.com`

Decision confirmed: ship **Coverage Level 2** (with 4 adapters), and keep a **Level 1 fallback** (side panel + copy/paste) for anything we can’t reliably read/write inline.

## Assumptions to validate (fast)
- Users understand “prompt quality” feedback if it’s framed as outcomes (“This reduces ambiguity…”) not jargon.
- Rewrites are the “wow” moment; rules-only lint is helpful but not sticky alone.
- A lightweight web app can validate demand before extension complexity.
