import test from "node:test";
import assert from "node:assert/strict";

import { analyzePrompt, applySuggestion, getRuleDefinitions } from "../extension/src/rules-engine.js";

test("exposes the first 20 rule definitions", () => {
  const rules = getRuleDefinitions();
  assert.equal(rules.length, 20);
  assert.equal(rules[0].id, "R001");
  assert.equal(rules[19].id, "R020");
});

test("detects missing output format on a vague prompt", () => {
  const result = analyzePrompt("Write a good launch plan for my product.", "write");
  const hasOutputFormatIssue = result.suggestions.some((item) => item.rule_id === "R004");
  assert.equal(hasOutputFormatIssue, true);
  assert.ok(result.score < 100);
});

test("autofix for JSON schema appends structured keys", () => {
  const prompt = "Return JSON for this analysis.";
  const result = analyzePrompt(prompt, "analyze");
  const schemaSuggestion = result.suggestions.find((item) => item.rule_id === "R016");
  assert.ok(schemaSuggestion);

  const fixed = applySuggestion(prompt, schemaSuggestion);
  assert.match(fixed, /JSON schema:/);
  assert.match(fixed, /"summary"/);
});

test("well-structured prompt keeps a fair-or-better score", () => {
  const prompt = [
    "Act as a B2B product marketer.",
    "Create a launch email for first-time admins in US English.",
    "Use these inputs: product notes below.",
    "Output format: 5 bullets with one CTA.",
    "Keep it under 120 words and cite assumptions."
  ].join(" ");

  const result = analyzePrompt(prompt, "write");
  assert.ok(result.score >= 60);
  assert.ok(result.suggestions.length <= 4);
});
