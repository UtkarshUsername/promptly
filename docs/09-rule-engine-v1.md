# Promptly V1 Rule Engine Spec

## `Suggestion` JSON Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://promptly.app/schemas/suggestion.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id",
    "rule_id",
    "title",
    "description",
    "severity",
    "category",
    "why_it_matters",
    "suggested_fix",
    "autofixable"
  ],
  "properties": {
    "id": {
      "type": "string",
      "description": "Stable suggestion instance id.",
      "pattern": "^sug_[a-z0-9_\\-]{6,}$"
    },
    "rule_id": {
      "type": "string",
      "description": "Rule identifier that generated this suggestion."
    },
    "title": {
      "type": "string",
      "minLength": 4,
      "maxLength": 120
    },
    "description": {
      "type": "string",
      "minLength": 12,
      "maxLength": 600
    },
    "severity": {
      "type": "string",
      "enum": ["low", "med", "high"]
    },
    "category": {
      "type": "string",
      "enum": [
        "goal_clarity",
        "context",
        "inputs",
        "constraints",
        "output_format",
        "examples",
        "verification",
        "structure"
      ]
    },
    "why_it_matters": {
      "type": "string",
      "minLength": 10,
      "maxLength": 500
    },
    "suggested_fix": {
      "type": "string",
      "minLength": 8,
      "maxLength": 700
    },
    "autofixable": {
      "type": "boolean"
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "evidence": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["kind", "text"],
        "properties": {
          "kind": {
            "type": "string",
            "enum": ["phrase", "missing_section", "conflict", "length_signal"]
          },
          "text": {
            "type": "string"
          }
        }
      }
    }
  }
}
```

## `AnalysisResult` JSON Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://promptly.app/schemas/analysis-result.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "prompt",
    "score",
    "summary",
    "suggestions",
    "rule_stats",
    "analyzed_at"
  ],
  "properties": {
    "prompt": {
      "type": "string",
      "minLength": 1
    },
    "score": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100
    },
    "label": {
      "type": "string",
      "enum": ["needs_work", "fair", "strong"]
    },
    "summary": {
      "type": "string",
      "minLength": 10,
      "maxLength": 500
    },
    "suggestions": {
      "type": "array",
      "items": {
        "$ref": "https://promptly.app/schemas/suggestion.schema.json"
      }
    },
    "rule_stats": {
      "type": "object",
      "additionalProperties": false,
      "required": ["evaluated", "triggered"],
      "properties": {
        "evaluated": {
          "type": "integer",
          "minimum": 0
        },
        "triggered": {
          "type": "integer",
          "minimum": 0
        }
      }
    },
    "meta": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "intent": {
          "type": "string",
          "enum": ["write", "analyze", "summarize", "code", "brainstorm", "other"]
        },
        "rules_only": {
          "type": "boolean"
        },
        "model": {
          "type": "string"
        }
      }
    },
    "analyzed_at": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

## First 20 lint rules
| id | name | what_it_detects | why_it_matters | example_bad_prompt | example_fix | severity | autofixable |
|---|---|---|---|---|---|---|---|
| `R001` | Missing explicit goal | Prompt has no clear action verb + outcome phrase | Models produce broad answers when success target is unclear | “Tell me about product launches.” | “Create a launch plan for a B2B SaaS feature release in the next 30 days.” | high | no |
| `R002` | Missing audience | No audience cue for writing/explanation tasks | Tone and complexity drift without audience definition | “Write an explanation of this feature.” | “Explain this feature to first-time ecommerce store owners.” | med | no |
| `R003` | Missing scope boundary | No length/scope limit on broad tasks | Unbounded prompts often return rambling outputs | “Analyze this market.” | “Analyze the US payroll SaaS market in 5 bullets and 1 risk table.” | med | no |
| `R004` | Missing output format | No required response structure (list/table/JSON) | Output becomes hard to reuse and compare | “Give me recommendations.” | “Return 5 recommendations in a table: option, benefit, risk, effort.” | high | yes |
| `R005` | Vague quality adjectives | Terms like “good”, “best”, “better” without criteria | Subjective adjectives cause inconsistent interpretations | “Write a good cold email.” | “Write a cold email with <120 words, one CTA, and neutral tone.” | med | no |
| `R006` | Missing source/input references | Prompt asks for analysis but provides no data/input | Model may hallucinate missing context | “Summarize our churn trend.” | “Summarize churn trend from this CSV and cite rows driving the change.” | high | no |
| `R007` | Multi-task without ordering | Multiple verbs/tasks with no step order | Mixed tasks reduce completion quality | “Research competitors, write copy, and draft ad variants.” | “Step 1: list 5 competitors. Step 2: extract messaging. Step 3: draft 3 ad variants.” | med | yes |
| `R008` | Conflicting constraints | Explicit contradiction (`short` + `detailed`, etc.) | Conflicts force arbitrary tradeoffs | “Give a very short but comprehensive deep analysis.” | “Give a concise summary in 6 bullets; include one optional deep-dive section.” | high | no |
| `R009` | Missing tone/style instruction | Writing tasks with no tone guidance | Tone mismatch increases manual rewriting | “Write a customer update.” | “Write a customer update in calm, transparent, plain English.” | low | no |
| `R010` | Unclear role framing | No role/context for complex domain tasks | Role framing improves assumptions and specificity | “Review this contract clause.” | “Act as a startup-friendly contracts advisor. Review this clause for negotiation risk.” | low | yes |
| `R011` | No success criteria | Prompt asks for recommendation but no ranking criteria | Model cannot prioritize choices reliably | “Pick the best channel strategy.” | “Rank channel strategy by CAC, speed to test, and implementation effort.” | med | no |
| `R012` | Missing edge-case instruction | Task likely has caveats but no fallback behavior | Outputs can fail in real-world exceptions | “Generate onboarding steps.” | “Generate onboarding steps and include fallback for users with missing billing info.” | low | no |
| `R013` | Missing verification request | Factual/analysis tasks with no verification ask | Encourages unchecked claims | “Give me 2025 cloud pricing trends.” | “List 2025 cloud pricing trends and mark uncertain claims explicitly.” | med | yes |
| `R014` | No citation requirement | Research-style prompt without citation format | Hard to audit source-backed statements | “Compare these frameworks.” | “Compare frameworks and cite sources inline as markdown links.” | med | yes |
| `R015` | No output language/locale | User context suggests locale-sensitive content but none specified | Locale mismatch causes unusable output in regional contexts | “Write support macros for my team.” | “Write support macros in US English with USD examples.” | low | no |
| `R016` | Missing JSON schema when JSON requested | Prompt says “output JSON” without field schema | Models emit inconsistent keys and shapes | “Return JSON for this analysis.” | “Return JSON with fields: `summary`(string), `risks`(string[]), `score`(0-100 integer).” | high | yes |
| `R017` | Overlong unstructured prompt | Very long prompt with no section headers | Structure loss reduces parsing accuracy | Long paragraph mixing goal, context, constraints, and examples | “Use sections: Goal, Context, Inputs, Constraints, Output Format.” | med | yes |
| `R018` | Placeholder leakage | Contains unresolved placeholders (`[X]`, `TODO`, `{{value}}`) | Unfilled placeholders break intent | “Write a plan for [industry] with budget {{amount}}.” | “Write a plan for fintech with budget $15,000.” | high | yes |
| `R019` | Ambiguous pronouns/references | Pronouns like “it/this/that” with multiple possible referents | Ambiguity causes wrong target interpretation | “Summarize it and improve this section.” | “Summarize the Q4 forecast and improve the ‘Risks’ section.” | med | no |
| `R020` | Missing response length control | No length guidance for concise-use tasks | Results may be too long to use in chat workflows | “Write a response to this customer email.” | “Write a response in 90-120 words with one clear next step.” | low | yes |

## Bonus: scoring approach (0-100)
- Start at `100`.
- For each triggered rule:
  - `high`: `-12`
  - `med`: `-7`
  - `low`: `-4`
- Clamp to `0-100`.
- Apply floor protections to reduce harsh penalties:
  - If prompt length < 20 chars, minimum score `20`.
  - If only low-severity issues, minimum score `60`.
- Label mapping:
  - `0-59`: `needs_work`
  - `60-79`: `fair`
  - `80-100`: `strong`
