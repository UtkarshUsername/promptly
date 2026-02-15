import { SCORE_LABELS } from "./constants.js";

const SEVERITY_POINTS = {
  high: 12,
  med: 7,
  low: 4
};

function makeSuggestionId(ruleId, index) {
  return `sug_${ruleId.toLowerCase()}_${String(index + 1).padStart(2, "0")}`;
}

function normalizeWhitespace(input) {
  return (input || "").replace(/\s+/g, " ").trim();
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function buildContext(prompt, intent) {
  const normalized = normalizeWhitespace(prompt);
  const lower = normalized.toLowerCase();
  const tokens = lower.split(/\s+/).filter(Boolean);

  return {
    prompt: normalized,
    lower,
    tokens,
    intent: intent || "other",
    length: normalized.length,
    hasGoalVerb: hasAny(lower, [
      /\b(create|write|draft|explain|summarize|analyze|compare|generate|plan|design|review|brainstorm|list|improve|rewrite|build|debug)\b/
    ]),
    hasAudience: hasAny(lower, [
      /\baudience\b/,
      /\bfor\s+(new|beginner|advanced|technical|non-technical|executive|customer|user|founder|student|marketer|analyst|team|manager)s?\b/,
      /\bto\s+(new|beginner|advanced|technical|non-technical|executive|customer|user|founder|student|marketer|analyst|team|manager)s?\b/
    ]),
    hasScope: hasAny(lower, [
      /\b\d+\s*(words?|chars?|characters?|sentences?|paragraphs?|bullets?|steps?|items?|minutes?)\b/,
      /\b(top|max(?:imum)?|at most|no more than|under|within)\b/
    ]),
    hasOutputFormat: hasAny(lower, [
      /\b(json|table|bullet|list|markdown|yaml|csv|xml|schema|rubric|sections?)\b/
    ]),
    hasTone: hasAny(lower, [
      /\b(tone|voice|style|formal|casual|friendly|professional|neutral|concise|persuasive|empathetic|direct)\b/
    ]),
    hasRole: hasAny(lower, [
      /\b(act as|you are|as a|as an|assume the role|role:)\b/
    ]),
    hasCriteria: hasAny(lower, [
      /\b(criteria|based on|rank by|prioritize|score by|evaluate by|trade[- ]?off)\b/
    ]),
    hasVerification: hasAny(lower, [
      /\b(verify|double-check|uncertain|confidence|assumption|fact-check|cite|sources?)\b/
    ]),
    hasCitationInstruction: hasAny(lower, [
      /\b(cite|citation|source|references?|links?)\b/
    ]),
    hasLocale: hasAny(lower, [
      /\b(english|spanish|french|german|hindi|us|uk|locale|regional|usd|eur|aud)\b/
    ]),
    hasLengthControl: hasAny(lower, [
      /\b\d+\s*(words?|characters?|chars?)\b/,
      /\b(concise|brief|short|under|within|max(?:imum)?|no more than)\b/
    ]),
    hasSections: hasAny(lower, [
      /\b(goal|context|inputs?|constraints?|output format|steps?)\s*:/
    ])
  };
}

function makeBaseSuggestion(rule, index, evidenceText = "") {
  return {
    id: makeSuggestionId(rule.id, index),
    rule_id: rule.id,
    title: rule.name,
    description: rule.description,
    severity: rule.severity,
    category: rule.category,
    why_it_matters: rule.why,
    suggested_fix: rule.fix,
    autofixable: rule.autofixable,
    confidence: rule.confidence,
    evidence: evidenceText
      ? [
          {
            kind: "phrase",
            text: evidenceText
          }
        ]
      : []
  };
}

function splitTaskCandidates(prompt) {
  return prompt
    .split(/\band then\b|\bthen\b|\band\b|;/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

const RULES = [
  {
    id: "R001",
    name: "Missing explicit goal",
    severity: "high",
    category: "goal_clarity",
    autofixable: false,
    confidence: 0.83,
    description: "The prompt lacks a clear action + outcome statement.",
    why: "A clear goal reduces broad, low-signal responses.",
    fix: "Start with one sentence describing the exact output you want.",
    detect: (ctx) => !ctx.hasGoalVerb
  },
  {
    id: "R002",
    name: "Missing audience",
    severity: "med",
    category: "context",
    autofixable: false,
    confidence: 0.7,
    description: "The prompt does not define who the response is for.",
    why: "Audience cues help the model match tone and complexity.",
    fix: "Add a target audience clause (for example: 'for first-time SaaS founders').",
    detect: (ctx) => (ctx.intent === "write" || /\b(write|explain|draft|email|post|copy)\b/.test(ctx.lower)) && !ctx.hasAudience
  },
  {
    id: "R003",
    name: "Missing scope boundary",
    severity: "med",
    category: "constraints",
    autofixable: false,
    confidence: 0.72,
    description: "The prompt is broad but has no scope limits.",
    why: "Scope limits keep outputs focused and practical.",
    fix: "Add limits such as length, number of items, or time window.",
    detect: (ctx) => ctx.length > 80 && !ctx.hasScope
  },
  {
    id: "R004",
    name: "Missing output format",
    severity: "high",
    category: "output_format",
    autofixable: true,
    confidence: 0.85,
    description: "No explicit response format is defined.",
    why: "A format request makes output easier to reuse and compare.",
    fix: "Specify output format (bullets, table, JSON, markdown sections).",
    detect: (ctx) => !ctx.hasOutputFormat
  },
  {
    id: "R005",
    name: "Vague quality adjectives",
    severity: "med",
    category: "constraints",
    autofixable: false,
    confidence: 0.78,
    description: "Subjective adjectives appear without measurable criteria.",
    why: "Words like 'good' or 'best' are interpreted inconsistently.",
    fix: "Replace vague adjectives with measurable requirements.",
    detect: (ctx) => /\b(good|best|better|nice|great|high-quality)\b/.test(ctx.lower) && !ctx.hasCriteria
  },
  {
    id: "R006",
    name: "Missing source/input references",
    severity: "high",
    category: "inputs",
    autofixable: false,
    confidence: 0.71,
    description: "The task expects analysis but does not define source inputs.",
    why: "Without input references, the model fills gaps with assumptions.",
    fix: "Add data/source context ('using this report', 'based on attached notes').",
    detect: (ctx) => /\b(analyze|summarize|compare|review|trend|insight)\b/.test(ctx.lower) && !/\b(based on|using|from|attached|below|following|dataset|csv|table|notes?)\b/.test(ctx.lower)
  },
  {
    id: "R007",
    name: "Multi-task without ordering",
    severity: "med",
    category: "structure",
    autofixable: true,
    confidence: 0.67,
    description: "Prompt asks for multiple tasks but no execution order.",
    why: "Ordered tasks reduce partial or mixed outputs.",
    fix: "Break tasks into numbered steps in sequence.",
    detect: (ctx) => {
      const taskCount = (ctx.lower.match(/\b(write|draft|summarize|analyze|compare|plan|research|generate|list|review|rewrite)\b/g) || []).length;
      const hasOrdering = /\b(step\s*\d+|first|second|third|1\.|2\.)\b/.test(ctx.lower);
      return taskCount >= 2 && !hasOrdering;
    }
  },
  {
    id: "R008",
    name: "Conflicting constraints",
    severity: "high",
    category: "constraints",
    autofixable: false,
    confidence: 0.82,
    description: "The prompt includes constraints that directly conflict.",
    why: "Conflicts force arbitrary compromises and unstable results.",
    fix: "Resolve contradictory constraints or separate them into options.",
    detect: (ctx) => {
      const shortAndDetailed = /\b(short|brief|concise)\b/.test(ctx.lower) && /\b(detailed|comprehensive|thorough|deep)\b/.test(ctx.lower);
      const noAndYes = /\b(do not|don't|without)\b/.test(ctx.lower) && /\b(include|with)\b/.test(ctx.lower);
      return shortAndDetailed || noAndYes;
    }
  },
  {
    id: "R009",
    name: "Missing tone/style instruction",
    severity: "low",
    category: "context",
    autofixable: false,
    confidence: 0.63,
    description: "The writing task has no tone/style guidance.",
    why: "Tone control reduces rewrites for audience fit.",
    fix: "Add style guidance (for example: neutral, professional, friendly).",
    detect: (ctx) => (ctx.intent === "write" || /\b(email|post|copy|message|announcement|reply)\b/.test(ctx.lower)) && !ctx.hasTone
  },
  {
    id: "R010",
    name: "Unclear role framing",
    severity: "low",
    category: "context",
    autofixable: true,
    confidence: 0.64,
    description: "A specialized task is requested without role framing.",
    why: "Role framing improves assumptions in domain-heavy tasks.",
    fix: "Add role context (for example: 'Act as a product marketer').",
    detect: (ctx) => /\b(contract|legal|architecture|finance|security|migration|compliance|incident|pricing|roadmap)\b/.test(ctx.lower) && !ctx.hasRole
  },
  {
    id: "R011",
    name: "No success criteria",
    severity: "med",
    category: "constraints",
    autofixable: false,
    confidence: 0.69,
    description: "Prompt asks for selection/recommendation without evaluation criteria.",
    why: "Criteria are needed for reproducible prioritization.",
    fix: "Add ranking dimensions (for example: effort, impact, risk).",
    detect: (ctx) => /\b(best|recommend|pick|choose|rank|prioritize)\b/.test(ctx.lower) && !ctx.hasCriteria
  },
  {
    id: "R012",
    name: "Missing edge-case instruction",
    severity: "low",
    category: "verification",
    autofixable: false,
    confidence: 0.57,
    description: "Process-like prompt lacks fallback/edge-case handling.",
    why: "Edge-case instructions improve real-world usability.",
    fix: "Add a fallback step for missing or invalid inputs.",
    detect: (ctx) => /\b(plan|workflow|process|onboarding|runbook|steps?)\b/.test(ctx.lower) && !/\b(edge case|fallback|if missing|if unavailable|exception)\b/.test(ctx.lower)
  },
  {
    id: "R013",
    name: "Missing verification request",
    severity: "med",
    category: "verification",
    autofixable: true,
    confidence: 0.73,
    description: "Factual task has no verification or uncertainty instruction.",
    why: "Verification prompts reduce overconfident wrong claims.",
    fix: "Ask the model to mark uncertain claims and verify key facts.",
    detect: (ctx) => /\b(trends?|facts?|analysis|forecast|compare|evidence|research)\b/.test(ctx.lower) && !ctx.hasVerification
  },
  {
    id: "R014",
    name: "No citation requirement",
    severity: "med",
    category: "verification",
    autofixable: true,
    confidence: 0.72,
    description: "Research-like request does not ask for sources.",
    why: "Source requirements make outputs auditable.",
    fix: "Require inline citations or a source list.",
    detect: (ctx) => /\b(research|compare|benchmark|report|study|market)\b/.test(ctx.lower) && !ctx.hasCitationInstruction
  },
  {
    id: "R015",
    name: "No output language/locale",
    severity: "low",
    category: "context",
    autofixable: false,
    confidence: 0.54,
    description: "User-facing writing task omits language/locale.",
    why: "Locale mismatches can make copy unusable.",
    fix: "Specify language and locale (for example: US English).",
    detect: (ctx) => /\b(email|ad|copy|support|customer|announcement|landing page)\b/.test(ctx.lower) && !ctx.hasLocale
  },
  {
    id: "R016",
    name: "Missing JSON schema when JSON requested",
    severity: "high",
    category: "output_format",
    autofixable: true,
    confidence: 0.88,
    description: "Prompt asks for JSON but does not define keys/types.",
    why: "Schema detail reduces malformed output.",
    fix: "Specify required fields with expected types and constraints.",
    detect: (ctx) => /\bjson\b/.test(ctx.lower) && !/\b(fields?|keys?|schema|type|shape|required)\b/.test(ctx.lower)
  },
  {
    id: "R017",
    name: "Overlong unstructured prompt",
    severity: "med",
    category: "structure",
    autofixable: true,
    confidence: 0.66,
    description: "Prompt is long and lacks section structure.",
    why: "Sectioning improves comprehension and output quality.",
    fix: "Split prompt into Goal, Context, Inputs, Constraints, Output sections.",
    detect: (ctx) => ctx.length > 700 && !ctx.hasSections && (ctx.prompt.match(/\n/g) || []).length < 4
  },
  {
    id: "R018",
    name: "Placeholder leakage",
    severity: "high",
    category: "inputs",
    autofixable: true,
    confidence: 0.9,
    description: "Prompt includes unresolved placeholders.",
    why: "Unresolved placeholders make outputs generic or broken.",
    fix: "Replace placeholders with concrete values before sending.",
    detect: (ctx) => /\[[^\]]+\]|\{\{[^}]+\}\}|\b(TODO|TBD|FIXME)\b/.test(ctx.prompt)
  },
  {
    id: "R019",
    name: "Ambiguous pronouns/references",
    severity: "med",
    category: "goal_clarity",
    autofixable: false,
    confidence: 0.56,
    description: "Prompt uses ambiguous references like 'it' or 'this'.",
    why: "Ambiguity increases the chance of targeting the wrong content.",
    fix: "Replace pronouns with explicit object names.",
    detect: (ctx) => /\b(summarize|improve|fix|analyze|rewrite)\s+(it|this|that)\b/.test(ctx.lower)
  },
  {
    id: "R020",
    name: "Missing response length control",
    severity: "low",
    category: "constraints",
    autofixable: true,
    confidence: 0.68,
    description: "Communication task has no response length guidance.",
    why: "Length controls keep outputs usable in real chat workflows.",
    fix: "Add target word count or maximum length.",
    detect: (ctx) => /\b(email|reply|response|message|cold email|outreach)\b/.test(ctx.lower) && !ctx.hasLengthControl
  }
];

const AUTOFIXERS = {
  R004: (prompt) => `${prompt.trim()}\n\nOutput format: Return the answer as concise bullet points with clear headings.`,
  R007: (prompt) => {
    const parts = splitTaskCandidates(prompt);
    if (parts.length < 2) {
      return prompt;
    }
    const steps = parts.map((part, index) => `${index + 1}. ${part.replace(/^[,\-\s]+/, "")}`).join("\n");
    return `Complete the task in this order:\n${steps}`;
  },
  R010: (prompt) => `Act as a domain specialist for this task.\n\n${prompt.trim()}`,
  R013: (prompt) => `${prompt.trim()}\n\nVerification: Flag uncertain claims and state what should be verified.`,
  R014: (prompt) => `${prompt.trim()}\n\nSources: Provide citations or links for factual claims.`,
  R016: (prompt) => `${prompt.trim()}\n\nJSON schema:\n{\n  "summary": "string",\n  "items": ["string"],\n  "score": 0\n}`,
  R017: (prompt) => `Goal:\n${prompt.trim()}\n\nContext:\n[insert context]\n\nInputs:\n[insert data or references]\n\nConstraints:\n[insert limits]\n\nOutput format:\n[insert desired structure]`,
  R018: (prompt) =>
    prompt
      .replace(/\{\{[^}]+\}\}/g, "[insert value]")
      .replace(/\[[^\]]+\]/g, "[insert value]")
      .replace(/\b(TODO|TBD|FIXME)\b/g, "[insert value]"),
  R020: (prompt) => `${prompt.trim()}\n\nLength: Keep the response between 90 and 120 words.`
};

function computeScore(prompt, suggestions) {
  let score = 100;
  for (const suggestion of suggestions) {
    score -= SEVERITY_POINTS[suggestion.severity] || 0;
  }
  score = Math.max(0, Math.min(100, score));

  if ((prompt || "").trim().length < 20) {
    score = Math.max(score, 20);
  }

  if (suggestions.length > 0 && suggestions.every((item) => item.severity === "low")) {
    score = Math.max(score, 60);
  }

  return score;
}

function resolveLabel(score) {
  if (score <= SCORE_LABELS.needs_work.max) {
    return "needs_work";
  }
  if (score <= SCORE_LABELS.fair.max) {
    return "fair";
  }
  return "strong";
}

function buildSummary(score, suggestions) {
  if (!suggestions.length) {
    return "Prompt is clear and well-structured. Add optional examples if you want even tighter output control.";
  }

  const top = suggestions.slice(0, 3).map((item) => item.title.toLowerCase());
  const label = resolveLabel(score);
  const labelText = SCORE_LABELS[label].title;
  return `${labelText}: fix ${top.join(", ")} to improve response reliability.`;
}

export function getRuleDefinitions() {
  return RULES.map((rule) => ({
    id: rule.id,
    name: rule.name,
    severity: rule.severity,
    category: rule.category,
    autofixable: rule.autofixable
  }));
}

export function analyzePrompt(prompt, intent = "other") {
  const context = buildContext(prompt, intent);
  const suggestions = [];

  RULES.forEach((rule, index) => {
    if (rule.detect(context)) {
      suggestions.push(makeBaseSuggestion(rule, index));
    }
  });

  suggestions.sort((a, b) => {
    const weight = { high: 3, med: 2, low: 1 };
    return weight[b.severity] - weight[a.severity];
  });

  const score = computeScore(context.prompt, suggestions);
  const label = resolveLabel(score);

  return {
    prompt: context.prompt,
    score,
    label,
    summary: buildSummary(score, suggestions),
    suggestions,
    rule_stats: {
      evaluated: RULES.length,
      triggered: suggestions.length
    },
    meta: {
      intent,
      rules_only: true,
      model: ""
    },
    analyzed_at: new Date().toISOString()
  };
}

export function applySuggestion(prompt, suggestion) {
  const fixer = AUTOFIXERS[suggestion.rule_id];
  if (!fixer) {
    return prompt;
  }
  return fixer(prompt).trim();
}
