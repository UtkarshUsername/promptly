# Promptly V1 UX Spec

## Confirmed product choices
- Surface: Browser extension (`side panel + popup`, Chromium-first).
- Scoring: Show numeric score (`0-100`) plus qualitative label.

## 1) Information architecture + key screens
### Landing (marketing web page)
- Hero: one-line value proposition, trust copy, primary CTA (`Install extension`), secondary CTA (`Watch demo`).
- How it works: 3-step flow (`Capture`, `Improve`, `Insert`).
- Proof strip: before/after prompt example with measurable improvements.
- FAQ: privacy, supported sites, BYOK setup.

### Editor (extension side panel)
- Input region: captured prompt textarea + intent selector.
- Action row: `Analyze` primary action, `Clear`, source label (`Selected text`, `Focused field`, `Manual paste`).
- Settings quick access: model/status chip + privacy/history status.

### Results (extension side panel)
- Summary header: score ring, label (`Strong/Fair/Needs work`), one-line diagnosis.
- Suggestions checklist: ranked cards grouped by impact.
- Improved Prompt hero panel: rewrite output, diff toggle, `Copy`, `Insert`, `Replace original`.

## 2) Layout wireframe descriptions
### Landing layout
- Top nav with compact wordmark + install CTA.
- Hero split: left copy stack, right animated “analysis panel” mock.
- Mid-page alternating sections with numbered outcomes.
- Footer with support and privacy links.

### Extension side panel layout
- Fixed header: logo, domain badge, settings icon.
- Scrollable body:
  - Section A: Original prompt editor.
  - Section B: Suggestion checklist with filter chips.
  - Section C: Improved prompt card (sticky actions).
- Sticky footer: `Copy improved` primary button + `Insert` secondary button.

### Popup quick layout
- Single compact card with `Capture current field`, `Open side panel`, and status chips.

## 3) Component list
- Prompt editor (`textarea`, line counter, intent dropdown, reset action).
- Suggestion card (`title`, impact badge, explanation, quick-fix button, apply state).
- Severity/impact badge (`High`, `Medium`, `Low`) with icon and color token.
- Score module (numeric score + label + short guidance).
- Rewrite panel (improved prompt textarea, copy/insert buttons).
- Diff view (inline add/remove highlighting against original text).
- Status chips (`Rules-only`, `LLM ready`, `Unsupported field fallback`).
- Toasts (`Copied`, `Inserted`, `Could not insert`).

## 4) Visual direction
Design direction: editorial productivity UI (clean, high-contrast, decisive accents), non-technical but confident.

### Color tokens
- `--bg-canvas: #f6f4ee`
- `--bg-panel: #fffdf8`
- `--bg-elevated: #fffaf0`
- `--ink-strong: #1a1816`
- `--ink-muted: #5f5851`
- `--line-soft: #d8d1c8`
- `--accent-primary: #0f766e`
- `--accent-primary-ink: #ecfdf9`
- `--accent-warning: #b45309`
- `--accent-danger: #b42318`
- `--accent-info: #1d4ed8`

### Typography scale
- Display: `Fraunces` 700 (landing hero).
- UI/body: `Manrope` 400/500/700.
- Sizes: `12, 14, 16, 18, 24, 32, 44`.
- Line-heights: `1.3` (headings), `1.5` (body), `1.6` (explanatory copy).

### Spacing, radius, shadows
- Spacing scale: `4, 8, 12, 16, 24, 32`.
- Radius: `10px` cards, `14px` hero cards, `999px` chips/buttons.
- Shadow: soft layered (`0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.07)`).

## 5) Microcopy
### Suggestion title + explanation examples
- `Missing Outcome`: “State exactly what success looks like in one sentence.”
- `Vague Constraint`: “Replace words like ‘good’ or ‘better’ with measurable criteria.”
- `No Output Format`: “Ask for a specific format (bullets/table/JSON) to reduce ambiguity.”
- `Missing Context`: “Add audience, channel, and business context so the model can prioritize.”
- `Multi-task Prompt`: “Split tasks into ordered steps to prevent partial or mixed outputs.”

### Empty states
- Editor empty: “Paste a prompt or capture text from the active field to start.”
- Results empty: “Run analysis to get a checklist and improved prompt.”

### Loading
- Rules pass: “Scanning for clarity, constraints, and structure…”
- Rewrite pass: “Drafting an improved version that preserves your intent…”

### Errors
- No API key: “LLM rewrite is off. Add an OpenRouter key in Settings or continue with rules-only mode.”
- Insert failed: “This editor blocks direct insertion. Your improved prompt is copied.”
- Network failure: “Couldn’t reach OpenRouter. Check key/model settings and try again.”

## 6) Interaction details
### Apply suggestion
- Each suggestion includes `Apply fix`.
- On click, Promptly patches only relevant text in the editor and highlights changed fragment for 2 seconds.
- Suggestion card transitions to `Applied` state and moves to a collapsed “Completed” group.
- Score recalculates immediately after each applied fix.

### Rewrite variants (optional)
- Variant tabs: `Default`, `Short`, `Strict format`.
- `Strict format` appears only if user requested a structured output.
- Switching variants never overwrites manual edits unless user confirms `Replace editor`.

## 7) Accessibility checklist
- Keyboard:
  - Full tab order through editor, cards, and action buttons.
  - `Cmd/Ctrl+Enter` triggers analyze.
  - `Cmd/Ctrl+Shift+I` inserts improved prompt when available.
- Focus states:
  - 3:1 minimum focus ring contrast on all interactive controls.
  - Visible focus ring not removed by custom styles.
- Contrast:
  - Body text >= 4.5:1.
  - Large headings/buttons >= 3:1.
- Screen reader:
  - Suggestion cards use semantic headings and `aria-live` for apply status.
  - Score has text alternative (`Prompt Health 74, Fair`).
- Motion:
  - Respect `prefers-reduced-motion`; disable non-essential transitions.
- Error handling:
  - All failures surfaced as text, not color-only indicators.
