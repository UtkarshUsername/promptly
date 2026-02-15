async function getSettings() {
  const response = await chrome.runtime.sendMessage({ type: "PROMPTLY_GET_SETTINGS" });
  return response?.settings || {};
}

function setStatus(text) {
  const el = document.getElementById("popupStatus");
  el.textContent = text;
}

async function saveDraft(text) {
  await chrome.storage.local.set({ sessionDraft: text || "" });
}

async function captureFromPage() {
  const resultEl = document.getElementById("captureResult");
  const response = await chrome.runtime.sendMessage({ type: "PROMPTLY_CAPTURE_ACTIVE" });

  if (!response?.ok) {
    resultEl.textContent = response?.error || "Unable to capture text from page.";
    return;
  }

  await saveDraft(response.text || "");
  resultEl.textContent = `Captured from ${response.source}. Open the side panel to analyze.`;
}

async function openSidePanel() {
  await chrome.runtime.sendMessage({ type: "PROMPTLY_OPEN_SIDE_PANEL" });
  window.close();
}

document.getElementById("captureBtn").addEventListener("click", captureFromPage);
document.getElementById("openPanelBtn").addEventListener("click", openSidePanel);

document.getElementById("saveDraftBtn").addEventListener("click", async () => {
  const text = document.getElementById("quickPrompt").value.trim();
  await saveDraft(text);
  document.getElementById("captureResult").textContent = "Draft saved. Open side panel to continue.";
});

document.getElementById("optionsBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

(async () => {
  const settings = await getSettings();
  if (settings.rulesOnlyMode || !settings.openRouterApiKey) {
    setStatus("Rules-only mode");
  } else {
    setStatus("LLM rewrite ready");
  }
})();
