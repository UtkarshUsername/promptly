# Prompt for LLM-rubric agent — critic + rewrite

You are creating the prompting/rubric layer for the LLM-assisted rewrite step.

## Context
Read:
- `docs/03-architecture.md`
- `docs/02-prd-v1.md`

## Task
Design:
1) A **system prompt** for the “Prompt Critic”
2) A **system prompt** for the “Prompt Rewriter”
3) A **single combined prompt** (optional) if we want fewer calls

## Requirements
- The rewrite must preserve user intent and constraints.
- The output must be easy to copy/paste.
- Provide optional variants: `default`, `short`, `strict_format` (if output format requested).
- The critic/rewrite should reference the rule-engine findings when available.

## Deliverables
- Prompts as plain text blocks
- Output JSON structure for the model responses
- A minimal evaluation checklist (5–8 items) to validate rewrite quality

