import { renderDiffHtml } from "./src/diff.js";
import { applySuggestion, analyzePrompt } from "./src/rules-engine.js";

const state = {
  settings: null,
  analysis: null,
  rewrite: null,
  activeVariant: "default",
  source: "manual",
  originalAtRewrite: ""
};

function labelTitle(label) {
  if (label === "strong") {
    return "Strong";
  }
  if (label === "fair") {
    return "Fair";
  }
  return "Needs work";
}

function showToast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1800);
}

async function sendMessage(payload) {
  return chrome.runtime.sendMessage(payload);
}

function setPromptLength() {
  const prompt = document.getElementById("promptInput").value;
  document.getElementById("promptLength").textContent = `${prompt.length} chars`;
}

function setSettingsStatus(settings) {
  const modelStatus = document.getElementById("modelStatus");
  const privacyStatus = document.getElementById("privacyStatus");

  if (settings.rulesOnlyMode || !settings.openRouterApiKey) {
    modelStatus.textContent = "Mode: Rules-only";
  } else {
    modelStatus.textContent = `Mode: LLM (${settings.openRouterModel})`;
  }

  privacyStatus.textContent = settings.historyEnabled ? "History: on" : "History: off";
}

function getCurrentImprovedText() {
  const textarea = document.getElementById("improvedPrompt");
  return textarea.value.trim();
}

function renderSuggestions() {
  const container = document.getElementById("suggestionsList");
  const count = document.getElementById("suggestionCount");
  container.innerHTML = "";

  const suggestions = state.analysis?.suggestions || [];
  count.textContent = `${suggestions.length} issue${suggestions.length === 1 ? "" : "s"}`;

  if (!suggestions.length) {
    container.innerHTML = "<p class='notice'>No major issues found. You can still generate a cleaner rewrite.</p>";
    return;
  }

  for (const suggestion of suggestions) {
    const card = document.createElement("article");
    card.className = "suggestion";

    const buttonLabel = suggestion.autofixable ? "Apply fix" : "Copy fix hint";

    card.innerHTML = `
      <div class="row space-between">
        <strong>${suggestion.title}</strong>
        <span class="badge ${suggestion.severity}">${suggestion.severity.toUpperCase()}</span>
      </div>
      <p>${suggestion.description}</p>
      <p class="notice"><strong>Why:</strong> ${suggestion.why_it_matters}</p>
      <p class="notice"><strong>Fix:</strong> ${suggestion.suggested_fix}</p>
      <div class="row">
        <button class="secondary" data-action="apply" data-rule-id="${suggestion.rule_id}">${buttonLabel}</button>
      </div>
    `;

    container.appendChild(card);
  }
}

function renderSummary() {
  const score = state.analysis?.score;
  const scoreLabel = state.analysis?.label || "needs_work";
  document.getElementById("scoreValue").textContent = typeof score === "number" ? String(score) : "--";
  document.getElementById("scoreLabel").textContent = typeof score === "number" ? `Prompt Health: ${labelTitle(scoreLabel)}` : "Run analysis";
  document.getElementById("summaryText").textContent = state.analysis?.summary || "Get a checklist and rewrite-ready findings.";
}

function renderRewrite() {
  const textarea = document.getElementById("improvedPrompt");
  const notes = document.getElementById("rewriteNotes");
  const strictButton = document.getElementById("strictVariantBtn");

  if (!state.rewrite) {
    textarea.value = "";
    notes.textContent = "Rewrite notes will appear here.";
    strictButton.style.display = "none";
    return;
  }

  const selectedText =
    state.rewrite.variants?.[state.activeVariant] ||
    state.rewrite.variants?.default ||
    state.rewrite.improved_prompt ||
    "";

  textarea.value = selectedText;
  const noteList = Array.isArray(state.rewrite.change_notes) ? state.rewrite.change_notes.join(" | ") : "Rewrite generated from lint findings.";
  notes.textContent = noteList || "Rewrite generated.";

  strictButton.style.display = state.rewrite.variants?.strict_format ? "inline-flex" : "none";

  document.querySelectorAll(".variant-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.variant === state.activeVariant);
  });
}

function renderDiff() {
  const view = document.getElementById("diffView");
  const improved = getCurrentImprovedText();
  if (!improved) {
    view.innerHTML = "<p class='notice'>Generate a rewrite to compare changes.</p>";
    return;
  }

  view.innerHTML = renderDiffHtml(state.originalAtRewrite || document.getElementById("promptInput").value, improved);
}

async function analyzeCurrentPrompt() {
  const prompt = document.getElementById("promptInput").value.trim();
  const intent = document.getElementById("intentSelect").value;

  if (!prompt) {
    showToast("Paste or capture a prompt first.");
    return;
  }

  state.analysis = analyzePrompt(prompt, intent);
  state.rewrite = null;
  state.originalAtRewrite = prompt;
  state.activeVariant = "default";

  renderSummary();
  renderSuggestions();
  renderRewrite();
  renderDiff();

  const sourceBadge = document.getElementById("sourceBadge");
  sourceBadge.textContent = `Source: ${state.source}`;

  await sendMessage({
    type: "PROMPTLY_ADD_HISTORY",
    entry: {
      timestamp: new Date().toISOString(),
      source: state.source,
      prompt,
      score: state.analysis.score,
      suggestion_count: state.analysis.suggestions.length
    }
  });
}

async function generateRewrite() {
  if (!state.analysis) {
    await analyzeCurrentPrompt();
  }

  if (!state.analysis) {
    return;
  }

  if (state.settings.rulesOnlyMode || !state.settings.openRouterApiKey) {
    showToast("Rewrite is unavailable in rules-only mode.");
    return;
  }

  const button = document.getElementById("rewriteBtn");
  button.disabled = true;
  button.textContent = "Rewriting...";

  const prompt = document.getElementById("promptInput").value.trim();
  const intent = document.getElementById("intentSelect").value;

  const response = await sendMessage({
    type: "PROMPTLY_REWRITE",
    payload: {
      prompt,
      intent,
      suggestions: state.analysis.suggestions
    }
  });

  button.disabled = false;
  button.textContent = "Generate Rewrite";

  if (!response?.ok) {
    showToast(response?.error || "Rewrite request failed.");
    return;
  }

  state.rewrite = response.data.rewriter;
  state.activeVariant = "default";
  state.originalAtRewrite = prompt;

  renderRewrite();
  renderDiff();
  showToast("Rewrite generated.");

  await sendMessage({
    type: "PROMPTLY_ADD_HISTORY",
    entry: {
      timestamp: new Date().toISOString(),
      source: "rewrite",
      prompt,
      improved_prompt: state.rewrite.improved_prompt,
      score: state.analysis.score,
      suggestion_count: state.analysis.suggestions.length
    }
  });
}

async function captureFromPage() {
  const response = await sendMessage({ type: "PROMPTLY_CAPTURE_ACTIVE" });
  if (!response?.ok) {
    showToast(response?.error || "Unable to capture text from page.");
    return;
  }

  document.getElementById("promptInput").value = response.text || "";
  setPromptLength();

  state.source = response.source || "capture";
  document.getElementById("sourceBadge").textContent = `Source: ${state.source}`;
  showToast("Prompt captured from active page.");
}

async function insertImprovedPrompt() {
  const text = getCurrentImprovedText();
  if (!text) {
    showToast("No improved prompt to insert.");
    return;
  }

  const response = await sendMessage({
    type: "PROMPTLY_INSERT_ACTIVE",
    text
  });

  if (response?.ok) {
    showToast("Inserted into page.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast("Insert failed. Copied to clipboard.");
  } catch (_error) {
    showToast(response?.error || "Insert failed.");
  }
}

async function copyImprovedPrompt() {
  const text = getCurrentImprovedText();
  if (!text) {
    showToast("No improved prompt to copy.");
    return;
  }

  await navigator.clipboard.writeText(text);
  showToast("Improved prompt copied.");
}

async function applySuggestionByRuleId(ruleId) {
  if (!state.analysis) {
    return;
  }

  const suggestion = state.analysis.suggestions.find((item) => item.rule_id === ruleId);
  if (!suggestion) {
    return;
  }

  if (suggestion.autofixable) {
    const input = document.getElementById("promptInput");
    input.value = applySuggestion(input.value, suggestion);
    setPromptLength();
    showToast(`Applied ${suggestion.title}.`);
    await analyzeCurrentPrompt();
    return;
  }

  await navigator.clipboard.writeText(suggestion.suggested_fix);
  showToast("Fix hint copied.");
}

async function loadSessionDraft() {
  const data = await chrome.storage.local.get(["sessionDraft"]);
  if (data.sessionDraft) {
    const input = document.getElementById("promptInput");
    input.value = data.sessionDraft;
    state.source = "draft";
    document.getElementById("sourceBadge").textContent = "Source: draft";
    setPromptLength();
    await chrome.storage.local.remove(["sessionDraft"]);
  }
}

function bindEvents() {
  document.getElementById("openOptionsBtn").addEventListener("click", () => chrome.runtime.openOptionsPage());
  document.getElementById("captureBtn").addEventListener("click", captureFromPage);
  document.getElementById("analyzeBtn").addEventListener("click", analyzeCurrentPrompt);
  document.getElementById("rewriteBtn").addEventListener("click", generateRewrite);
  document.getElementById("clearBtn").addEventListener("click", () => {
    document.getElementById("promptInput").value = "";
    document.getElementById("improvedPrompt").value = "";
    document.getElementById("diffView").style.display = "none";
    state.analysis = null;
    state.rewrite = null;
    renderSummary();
    renderSuggestions();
    renderRewrite();
    setPromptLength();
  });

  document.getElementById("copyImprovedBtn").addEventListener("click", copyImprovedPrompt);
  document.getElementById("insertImprovedBtn").addEventListener("click", insertImprovedPrompt);

  document.getElementById("toggleDiffBtn").addEventListener("click", () => {
    const diff = document.getElementById("diffView");
    const visible = diff.style.display !== "none";
    diff.style.display = visible ? "none" : "block";
    document.getElementById("toggleDiffBtn").textContent = visible ? "Show Diff" : "Hide Diff";
    renderDiff();
  });

  document.getElementById("promptInput").addEventListener("input", setPromptLength);

  document.getElementById("suggestionsList").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action='apply']");
    if (!button) {
      return;
    }
    await applySuggestionByRuleId(button.dataset.ruleId);
  });

  document.querySelectorAll(".variant-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeVariant = button.dataset.variant;
      renderRewrite();
      renderDiff();
    });
  });

  document.addEventListener("keydown", async (event) => {
    const isCmdOrCtrl = event.metaKey || event.ctrlKey;
    if (isCmdOrCtrl && event.key === "Enter") {
      event.preventDefault();
      await analyzeCurrentPrompt();
      return;
    }

    if (isCmdOrCtrl && event.shiftKey && event.key.toLowerCase() === "i") {
      event.preventDefault();
      await insertImprovedPrompt();
    }
  });
}

async function init() {
  const settingsResponse = await sendMessage({ type: "PROMPTLY_GET_SETTINGS" });
  state.settings = settingsResponse.settings;
  setSettingsStatus(state.settings);

  bindEvents();
  await loadSessionDraft();
  renderSummary();
  renderSuggestions();
  renderRewrite();
  setPromptLength();
}

init().catch((error) => {
  showToast(error.message || "Failed to initialize side panel.");
});
