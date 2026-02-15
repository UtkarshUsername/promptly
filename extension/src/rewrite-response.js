function stripCodeFences(input) {
  return String(input || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function extractFirstJsonObject(input) {
  const text = String(input || "");
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
      continue;
    }

    if (char === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return "";
}

export function parseModelJson(rawText) {
  if (!rawText) {
    return null;
  }

  const cleaned = stripCodeFences(rawText);

  try {
    return JSON.parse(cleaned);
  } catch (_error) {
    const extracted = extractFirstJsonObject(cleaned);
    if (!extracted) {
      return null;
    }

    try {
      return JSON.parse(extracted);
    } catch (_innerError) {
      return null;
    }
  }
}

function asString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizePriorityIssues(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, 8)
    .map((item) => ({
      title: asString(item?.title),
      reason: asString(item?.reason),
      fix_hint: asString(item?.fix_hint),
      severity: ["low", "med", "high"].includes(item?.severity) ? item.severity : "med",
      linked_rule_id: asString(item?.linked_rule_id)
    }))
    .filter((item) => item.title && item.fix_hint);
}

function normalizeVariants(value, improvedPrompt) {
  const defaults = {
    default: improvedPrompt,
    short: improvedPrompt,
    strict_format: ""
  };

  if (!value || typeof value !== "object") {
    return defaults;
  }

  return {
    default: asString(value.default, improvedPrompt),
    short: asString(value.short, improvedPrompt),
    strict_format: asString(value.strict_format, "")
  };
}

function normalizeChangeNotes(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, 3)
    .map((item) => asString(item))
    .filter(Boolean);
}

export function normalizeRewriteResponse(parsed) {
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const rawImproved =
    asString(parsed?.rewriter?.improved_prompt) ||
    asString(parsed?.rewriter?.variants?.default) ||
    asString(parsed?.rewriter?.variants?.short);

  if (!rawImproved) {
    return null;
  }

  const improvedPrompt = rawImproved.trim();
  if (!improvedPrompt) {
    return null;
  }

  const normalized = {
    critic: {
      summary: asString(parsed?.critic?.summary),
      priority_issues: normalizePriorityIssues(parsed?.critic?.priority_issues)
    },
    rewriter: {
      improved_prompt: improvedPrompt,
      variants: normalizeVariants(parsed?.rewriter?.variants, improvedPrompt),
      change_notes: normalizeChangeNotes(parsed?.rewriter?.change_notes)
    }
  };

  if (!normalized.rewriter.variants.default) {
    normalized.rewriter.variants.default = improvedPrompt;
  }

  if (!normalized.rewriter.variants.short) {
    normalized.rewriter.variants.short = improvedPrompt;
  }

  return normalized;
}
