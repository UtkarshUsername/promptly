function setStatus(text) {
  document.getElementById("saveStatus").textContent = text;
}

async function sendMessage(payload) {
  return chrome.runtime.sendMessage(payload);
}

function getSiteSettings() {
  return {
    "*": document.getElementById("siteGlobal").checked,
    "chatgpt.com": document.getElementById("siteChatGPT").checked,
    "claude.ai": document.getElementById("siteClaude").checked,
    "gemini.google.com": document.getElementById("siteGemini").checked,
    "chat.deepseek.com": document.getElementById("siteDeepSeek").checked
  };
}

function applySettingsToUI(settings) {
  document.getElementById("apiKey").value = settings.openRouterApiKey || "";
  document.getElementById("model").value = settings.openRouterModel || "openai/gpt-4o-mini";
  document.getElementById("rulesOnlyMode").checked = Boolean(settings.rulesOnlyMode);
  document.getElementById("historyEnabled").checked = Boolean(settings.historyEnabled);

  const sites = settings.enabledSites || {};
  document.getElementById("siteGlobal").checked = sites["*"] !== false;
  document.getElementById("siteChatGPT").checked = sites["chatgpt.com"] !== false;
  document.getElementById("siteClaude").checked = sites["claude.ai"] !== false;
  document.getElementById("siteGemini").checked = sites["gemini.google.com"] !== false;
  document.getElementById("siteDeepSeek").checked = sites["chat.deepseek.com"] !== false;
}

async function saveSettings() {
  const payload = {
    openRouterApiKey: document.getElementById("apiKey").value.trim(),
    openRouterModel: document.getElementById("model").value.trim() || "openai/gpt-4o-mini",
    rulesOnlyMode: document.getElementById("rulesOnlyMode").checked,
    historyEnabled: document.getElementById("historyEnabled").checked,
    enabledSites: getSiteSettings()
  };

  const response = await sendMessage({ type: "PROMPTLY_SAVE_SETTINGS", settings: payload });
  if (!response?.ok) {
    setStatus(response?.error || "Failed to save settings.");
    return;
  }

  setStatus("Settings saved.");
}

async function validateKey() {
  const apiKey = document.getElementById("apiKey").value.trim();
  if (!apiKey) {
    setStatus("Enter an OpenRouter key first.");
    return;
  }

  const prevRulesOnly = document.getElementById("rulesOnlyMode").checked;
  if (prevRulesOnly) {
    setStatus("Disable rules-only mode before validating key.");
    return;
  }

  await saveSettings();

  setStatus("Validating key with a small rewrite request...");
  const response = await sendMessage({
    type: "PROMPTLY_REWRITE",
    payload: {
      prompt: "Write a concise summary of customer churn trends in 4 bullets.",
      intent: "analyze",
      suggestions: []
    }
  });

  if (!response?.ok) {
    setStatus(`Validation failed: ${response?.error || "Unknown error"}`);
    return;
  }

  setStatus("Key validated successfully.");
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return value;
  }
}

async function renderHistory() {
  const list = document.getElementById("historyList");
  const response = await sendMessage({ type: "PROMPTLY_GET_HISTORY" });

  if (!response?.ok) {
    list.innerHTML = `<p class='notice'>${response?.error || "Unable to load history."}</p>`;
    return;
  }

  const entries = response.entries || [];
  if (!entries.length) {
    list.innerHTML = "<p class='notice'>No local history yet. Enable history and run analyses to populate this list.</p>";
    return;
  }

  list.innerHTML = "";
  for (const entry of entries) {
    const item = document.createElement("article");
    item.className = "history-item";
    const snippet = (entry.prompt || "").slice(0, 180);
    item.innerHTML = `
      <div class="row space-between">
        <strong>${entry.source || "analysis"}</strong>
        <span class="notice">${formatDate(entry.timestamp)}</span>
      </div>
      <p class="notice">Score: ${entry.score ?? "n/a"} | Issues: ${entry.suggestion_count ?? "n/a"}</p>
      <p>${snippet}${entry.prompt && entry.prompt.length > 180 ? "…" : ""}</p>
    `;
    list.appendChild(item);
  }
}

async function clearHistory() {
  const response = await sendMessage({ type: "PROMPTLY_CLEAR_HISTORY" });
  if (!response?.ok) {
    setStatus(response?.error || "Unable to clear history.");
    return;
  }

  setStatus("History cleared.");
  await renderHistory();
}

async function init() {
  const settings = await sendMessage({ type: "PROMPTLY_GET_SETTINGS" });
  applySettingsToUI(settings.settings || {});

  document.getElementById("saveBtn").addEventListener("click", saveSettings);
  document.getElementById("validateBtn").addEventListener("click", validateKey);
  document.getElementById("refreshHistoryBtn").addEventListener("click", renderHistory);
  document.getElementById("clearHistoryBtn").addEventListener("click", clearHistory);

  await renderHistory();
}

init().catch((error) => {
  setStatus(error.message || "Failed to initialize settings page.");
});
