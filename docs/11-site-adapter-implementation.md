# Promptly V1 Site Adapter Implementation

## ChatGPT (`chatgpt.com`)
1) Editor type and caveats
- Primary editor type: `textarea` (composer input).
- Caveats: composer DOM can re-render after route changes; selector fallback is required.

2) Strategy
- Detect compose box: prefer `#prompt-textarea`, then `textarea[data-id='root']`, then generic message textarea fallbacks.
- Read draft text: read `.value` from textarea.
- Insert/replace text: set native textarea value and dispatch `input` + `change` events.
- Read selection: use browser `Selection` first; if selection is inside editor, prioritize it.

3) DOM hooks / heuristics
- `#prompt-textarea`
- `textarea[data-id='root']`
- `textarea[placeholder*='Message']`
- `main textarea`

4) Failure modes + fallback
- No editor found after route change -> return `EDITOR_NOT_FOUND`, fallback to copy-only.
- Site disabled in settings -> `SITE_DISABLED`, no read/write attempt.
- Insert event blocked -> `INSERT_FAILED`, fallback to clipboard copy.

5) Manual test checklist
- Open ChatGPT and place cursor in composer.
- Use Promptly capture and confirm source is `site_adapter` or `focused_field`.
- Generate improved prompt and use insert.
- Confirm composer updates and can be submitted.
- Disable `chatgpt.com` in settings and verify blocked capture/insert with clear reason.

## Claude (`claude.ai`)
1) Editor type and caveats
- Primary editor type: `contenteditable` textbox; some states may expose textarea fallback.
- Caveats: contenteditable selection handling varies with app updates.

2) Strategy
- Detect compose box: match role-based and test-id-based contenteditable selectors first.
- Read draft text: use `innerText`/`textContent` normalized to single-line spacing.
- Insert/replace text: focus element, replace full contents through range operations, insert text nodes with line breaks, dispatch `input`/`change`.
- Read selection: check if current `Selection` range is inside the editor container.

3) DOM hooks / heuristics
- `div[contenteditable='true'][role='textbox']`
- `div[contenteditable='true'][data-testid*='composer']`
- `div[contenteditable='true'][data-is-editable='true']`
- `textarea`

4) Failure modes + fallback
- Compose node not mounted yet -> `EDITOR_NOT_FOUND`, fallback to manual paste.
- Contenteditable blocks insertion semantics -> `INSERT_FAILED`, fallback to clipboard copy.
- Site disabled -> `SITE_DISABLED`.

5) Manual test checklist
- Open Claude chat and type sample prompt.
- Capture from Promptly and verify text retrieval.
- Insert improved prompt and verify full replacement behavior.
- Select partial text in composer and verify selection capture works.

## Gemini (`gemini.google.com`)
1) Editor type and caveats
- Primary editor type: `contenteditable` textbox.
- Caveats: dynamic panel transitions can recreate editor nodes.

2) Strategy
- Detect compose box: role-based contenteditable selector with fallback by aria-label and textarea.
- Read draft text: normalize `innerText` from contenteditable.
- Insert/replace text: range replacement in contenteditable + input/change events.
- Read selection: capture selected text if selection is within compose editor.

3) DOM hooks / heuristics
- `div[contenteditable='true'][role='textbox']`
- `div[contenteditable='true'][aria-label*='prompt']`
- `textarea`

4) Failure modes + fallback
- Editor unavailable on load transition -> `EDITOR_NOT_FOUND`.
- Insert behavior blocked by editor internals -> `INSERT_FAILED`, fallback clipboard copy.
- Site disabled -> `SITE_DISABLED`.

5) Manual test checklist
- Open Gemini chat and place text in composer.
- Capture from Promptly and confirm source + adapter health.
- Insert improved prompt and verify composer receives updated content.
- Test when no active editor is focused and verify reason message.

## DeepSeek (`chat.deepseek.com`)
1) Editor type and caveats
- Primary editor type: usually `textarea`, with contenteditable fallback.
- Caveats: editor layout can switch based on viewport and product updates.

2) Strategy
- Detect compose box: textarea first, then role-based contenteditable.
- Read draft text: `.value` for textarea or normalized text for contenteditable.
- Insert/replace text: native setter for textarea, range replacement for contenteditable.
- Read selection: global selection first, editor-contained selection preferred.

3) DOM hooks / heuristics
- `textarea`
- `div[contenteditable='true'][role='textbox']`
- `div[contenteditable='true']`

4) Failure modes + fallback
- Compose not present -> `EDITOR_NOT_FOUND`.
- Write denied by host script -> `INSERT_FAILED` + clipboard copy.
- Site disabled -> `SITE_DISABLED`.

5) Manual test checklist
- Open DeepSeek chat and type a draft.
- Capture with Promptly and verify successful fetch.
- Insert improved text and ensure editor updates.
- Disable adapter in settings and verify blocked behavior.

## Generic adapter (`*` fallback)
1) Editor type and caveats
- Supports standard `textarea`, text `input`, and simple `contenteditable`.
- Does not guarantee compatibility with complex virtual editors (shadow DOM/iframe-heavy editors).

2) Strategy
- Detect compose box: focused editable first, then first visible generic editable.
- Read draft text: value/text extraction with whitespace normalization.
- Insert text: native input setter or contenteditable range replacement.
- Read selection: use browser selection and, when possible, verify range is within target editor.

3) DOM hooks / heuristics
- `textarea`
- `input[type='text']`
- `div[contenteditable='true']`

4) Failure modes + fallback
- No editable target -> `EDITOR_NOT_FOUND` or `NO_TARGET`.
- Unsupported or blocked editor -> `UNSUPPORTED_EDITOR` / `INSERT_FAILED`.
- Always fallback to copy-to-clipboard in side panel if insert fails.

5) Manual test checklist
- Test on a standard form textarea page.
- Test on simple contenteditable page.
- Validate capture, insert, and fallback copy behavior.
- Verify no prompt content appears in logs/errors beyond UI-local messages.
