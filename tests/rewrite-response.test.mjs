import test from "node:test";
import assert from "node:assert/strict";

import { normalizeRewriteResponse, parseModelJson } from "../extension/src/rewrite-response.js";

test("parseModelJson parses fenced JSON", () => {
  const raw = "```json\n{\n  \"rewriter\": {\n    \"improved_prompt\": \"Prompt\"\n  }\n}\n```";
  const parsed = parseModelJson(raw);
  assert.equal(parsed.rewriter.improved_prompt, "Prompt");
});

test("parseModelJson extracts JSON when model adds prose", () => {
  const raw = "Here is your result:\n{\"rewriter\":{\"improved_prompt\":\"Use strict bullets\"},\"critic\":{\"summary\":\"ok\"}}\nThanks.";
  const parsed = parseModelJson(raw);
  assert.equal(parsed.rewriter.improved_prompt, "Use strict bullets");
});

test("normalizeRewriteResponse fills missing variants with improved prompt", () => {
  const normalized = normalizeRewriteResponse({
    rewriter: {
      improved_prompt: "Write 5 bullets.",
      variants: {},
      change_notes: ["Added format", 22]
    },
    critic: {
      summary: "Missing format",
      priority_issues: [
        {
          title: "No output format",
          reason: "Ambiguous output",
          fix_hint: "Request bullets",
          severity: "high"
        }
      ]
    }
  });

  assert.equal(normalized.rewriter.variants.default, "Write 5 bullets.");
  assert.equal(normalized.rewriter.variants.short, "Write 5 bullets.");
  assert.equal(normalized.rewriter.change_notes.length, 1);
  assert.equal(normalized.critic.priority_issues.length, 1);
});

test("normalizeRewriteResponse returns null when improved prompt is missing", () => {
  const normalized = normalizeRewriteResponse({
    rewriter: {
      variants: {}
    }
  });

  assert.equal(normalized, null);
});
