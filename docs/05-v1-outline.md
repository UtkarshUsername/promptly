# V1 Outline — what “done” looks like

## Screens
1) Landing
   - One sentence value prop
   - Demo GIF/video placeholder
   - “Try it” CTA + optional waitlist

2) Editor
   - Prompt input (paste/type)
   - Optional dropdown: intent (write/analyze/code/etc.)
   - Button: Analyze

3) Results
   - Score + short summary (“Your prompt is missing X, Y”)
   - Suggestions list (ranked; each has: issue → fix → why)
   - “Improved prompt” panel (rewrite)
   - Copy buttons (original / improved)

## V1 user journey (happy path)
Paste prompt → Analyze → apply 1–3 suggestions → copy improved prompt → use it in their LLM tool → come back with the next prompt.

## Complexity estimate
- Web app V1: **medium**
- Chrome extension V1: **ambitious** (more UI states, permissions, site quirks)

## What you’ll need (accounts/services)
- LLM provider key (if we do rewrites): OpenAI or Anthropic
- Hosting: Vercel/Netlify (web) or Chrome Web Store (extension)
- Analytics: privacy-friendly (optional)
- Domain name (for launch)

## V1 monetization
- **Free** while BYOK (OpenRouter key supplied by the user).
- Revisit freemium only when we offer hosted LLM usage.

## Key decisions (we should lock before building)
- V1 surface: web app or extension side panel
- LLM rewrite: on/off/optional
- Privacy: store prompts or not
- Primary persona + use case
