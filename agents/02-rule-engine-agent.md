# Prompt for rule-engine agent — Prompt lint + suggestions

You are designing the V1 rules engine for Promptly.

## Context
Read:
- `docs/02-prd-v1.md`
- `docs/03-architecture.md`
- `docs/04-backlog.md`

## Output format (strict)
Provide a JSON schema (as JSON) for:
- `Suggestion` object
- `AnalysisResult` object

Then define the first **20 lint rules** in a table with:
- `id`
- `name`
- `what_it_detects`
- `why_it_matters`
- `example_bad_prompt`
- `example_fix`
- `severity` (low/med/high)
- `autofixable` (yes/no)

## Design requirements
- Suggestions must be actionable and not “generic best practices”.
- Rules should avoid false positives where possible.
- Rules should be model-agnostic unless clearly tied to structured output.

## Bonus (if time)
- Scoring approach: how to compute a 0–100 “Prompt Health” score.

