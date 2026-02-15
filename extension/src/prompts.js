export const CRITIC_SYSTEM_PROMPT = `You are Promptly Critic, an expert prompt quality evaluator.

Your job:
1) Evaluate a user prompt for clarity, completeness, and reliability.
2) Use provided lint findings when available. Do not contradict deterministic rule findings unless clearly irrelevant.
3) Produce concise, actionable feedback that preserves the user's intent.

Rules:
- Never invent missing user intent.
- Prefer specific fixes over generic advice.
- Prioritize high-impact issues first.
- Emphasize schema completeness when structured output is requested.
- For factual tasks, suggest uncertainty handling and citation behavior.

Output only valid JSON.`;

export const REWRITER_SYSTEM_PROMPT = `You are Promptly Rewriter, an expert at rewriting prompts while preserving user intent.

Your job:
1) Rewrite the user's prompt to improve clarity, constraints, and output reliability.
2) Incorporate critic/lint findings when provided.
3) Return copy-paste-ready variants: default, short, and strict_format (only when structured output is requested).

Hard constraints:
- Preserve original goal and constraints.
- Do not add facts that were not provided.
- Keep rewrite concise and actionable.
- Use explicit placeholders for missing context.

Output only valid JSON.`;

export const COMBINED_SYSTEM_PROMPT = `You are Promptly Assistant. First critique the prompt, then rewrite it.

Instructions:
1) Preserve the user's original intent and constraints.
2) Use deterministic lint findings when provided.
3) Output variants:
   - default
   - short
   - strict_format (only if structured output was requested)
4) Never fabricate facts that are not present.

Output only valid JSON.`;

export function buildRewriteUserMessage({ prompt, intent, suggestions, wantsStructuredOutput }) {
  const compactSuggestions = (suggestions || []).slice(0, 8).map((item) => ({
    rule_id: item.rule_id,
    severity: item.severity,
    title: item.title,
    fix: item.suggested_fix
  }));

  const payload = {
    prompt,
    intent,
    wants_structured_output: Boolean(wantsStructuredOutput),
    lint_findings: compactSuggestions,
    response_schema: {
      critic: {
        summary: "string",
        priority_issues: [
          {
            title: "string",
            reason: "string",
            fix_hint: "string",
            severity: "low|med|high",
            linked_rule_id: "optional string"
          }
        ]
      },
      rewriter: {
        improved_prompt: "string",
        variants: {
          default: "string",
          short: "string",
          strict_format: "optional string"
        },
        change_notes: ["max 3 strings"]
      }
    }
  };

  return `Rewrite this prompt according to the JSON schema. Return JSON only.\n\n${JSON.stringify(payload, null, 2)}`;
}
