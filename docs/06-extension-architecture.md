# Extension architecture (V1)

## Goal
Deliver Grammarly-like value with an extension-first approach, without overpromising “works in every editor”.

## Recommended capability tiers
- **Tier 1 (launch):** Side panel works everywhere; inline support for `input/textarea` + simple `contenteditable`.
- **Tier 2:** Add site adapters (2–3 high-value sites).
- **Tier 3:** Broad “any editor” coverage (ongoing work).

## Core extension pieces
1) **Content script**
   - Detects current selection and focused editable element.
   - Extracts text when possible.
   - Inserts the improved prompt on user action (best-effort).

2) **UI surface**
   - **Side panel** (preferred for serious use) and/or **popup** (quick actions).
   - Panels: original prompt, suggestions, improved prompt, copy/insert buttons.

3) **Background / service worker**
   - Owns OpenRouter network calls.
   - Keeps API key out of content scripts.
   - Applies rate limiting and error mapping for UI.

4) **Options page**
   - OpenRouter API key (BYOK) setup + validation
   - Model selection (default) + advanced settings
   - Privacy settings: history on/off; clear history
   - Site-specific toggles (enable/disable inline mode per domain)

## Permissions (principles)
- Request the minimum.
- Prefer “on-click” / user-triggered extraction instead of always-on page scraping.
- Be transparent: show what Promptly can and cannot read/write.

## Storage (V1 recommendation)
- Store:
  - API key (local extension storage)
  - settings (per-site toggles, model choice)
  - optional prompt history (only if user opts in)
- Do not store prompts remotely in V1.

