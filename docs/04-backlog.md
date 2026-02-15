# Backlog (prioritized)

## Milestone 0 — Decisions (1 day)
- Choose V1 surface (web vs extension)
- Choose whether V1 uses LLM calls (yes/no/optional)
- Pick primary persona + top 3 use cases
- Pick inline **Coverage Level** (Level 1/2/3 from `docs/01-discovery.md`)

## Milestone 1 — V1 Spec Lock (1–2 days)
- Finalize PRD
- Define lint rules (first 20)
- Define rewrite rubric + output schema for suggestions
- Define extension UX: side panel vs popup vs both; options/settings page

## Milestone 2 — Usable Alpha (1–2 weeks)
- Extension scaffolding (manifest, background/service worker, content script)
- Prompt editor UI (side panel/popup)
- Rule-based analysis + scoring
- Suggestion rendering + “apply” actions
- OpenRouter BYOK setup (store key locally, validate, model picker)
- Improved prompt generation (LLM via OpenRouter)
- Insert improved prompt back into field (where supported)

## Milestone 3 — Beta + Share (1 week)
- Export/share (copy, download, or shareable snippet)
- Basic analytics (no prompt content)
- Landing page + waitlist

## Milestone 4 — Public Launch (1 week)
- Store listing + onboarding polish
- Error handling + rate limits
- Polish pass (performance, copy, onboarding)

## Later — Monetization (post-V1)
- Hosted LLM usage (non-BYOK) with usage limits
- Freemium plans, teams, and prompt libraries

## Candidate lint rules (starter set)
- Missing explicit goal
- Missing target audience
- Missing constraints (time, scope, tone, length)
- Missing output format (bullets/table/JSON)
- Vague adjectives (“good”, “best”, “nice”) without criteria
- Missing inputs / references
- Multi-task prompt without ordering
- Conflicting constraints (e.g., “short and detailed”)
