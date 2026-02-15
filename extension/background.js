import { COMBINED_SYSTEM_PROMPT, buildRewriteUserMessage } from "./src/prompts.js";
import {
  addHistoryEntry,
  clearHistory,
  getHistory,
  getSettings,
  saveSettings,
  updateSettings
} from "./src/storage.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function sendContentMessage(tabId, payload) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, payload, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { ok: false, error: "No response from content script" });
    });
  });
}

function parseJsonSafe(text) {
  if (!text) {
    return null;
  }

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_error) {
    return null;
  }
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) {
    throw new Error("No active tab found");
  }
  return tabs[0];
}

async function requestRewrite({ prompt, intent, suggestions }) {
  const settings = await getSettings();

  if (settings.rulesOnlyMode || !settings.openRouterApiKey) {
    return {
      ok: false,
      error: "LLM rewrite is disabled. Add an OpenRouter key or disable rules-only mode.",
      code: "MISSING_API_KEY"
    };
  }

  const wantsStructuredOutput = /\b(json|table|schema|csv|yaml|xml)\b/i.test(prompt || "");
  const userMessage = buildRewriteUserMessage({
    prompt,
    intent,
    suggestions,
    wantsStructuredOutput
  });

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.openRouterApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: settings.openRouterModel,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: COMBINED_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    })
  });

  if (!response.ok) {
    const payload = await response.text();
    return {
      ok: false,
      code: "OPENROUTER_ERROR",
      error: `OpenRouter request failed (${response.status}): ${payload.slice(0, 300)}`
    };
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  const parsed = parseJsonSafe(content);

  if (!parsed || !parsed.rewriter) {
    return {
      ok: false,
      code: "INVALID_REWRITE_RESPONSE",
      error: "Model response was not valid rewrite JSON."
    };
  }

  return {
    ok: true,
    data: parsed
  };
}

chrome.runtime.onInstalled.addListener(async () => {
  await updateSettings({});
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-side-panel") {
    return;
  }
  const tab = await getActiveTab();
  if (chrome.sidePanel && chrome.sidePanel.open) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message?.type) {
      case "PROMPTLY_GET_SETTINGS": {
        const settings = await getSettings();
        sendResponse({ ok: true, settings });
        return;
      }
      case "PROMPTLY_SAVE_SETTINGS": {
        const settings = await saveSettings(message.settings || {});
        sendResponse({ ok: true, settings });
        return;
      }
      case "PROMPTLY_CAPTURE_ACTIVE": {
        const tab = await getActiveTab();
        const settings = await getSettings();
        const result = await sendContentMessage(tab.id, {
          type: "PROMPTLY_CONTENT_CAPTURE",
          enabledSites: settings.enabledSites
        });
        sendResponse(result);
        return;
      }
      case "PROMPTLY_INSERT_ACTIVE": {
        const tab = await getActiveTab();
        const settings = await getSettings();
        const result = await sendContentMessage(tab.id, {
          type: "PROMPTLY_CONTENT_INSERT",
          text: message.text || "",
          enabledSites: settings.enabledSites
        });
        sendResponse(result);
        return;
      }
      case "PROMPTLY_GET_ACTIVE_HEALTH": {
        const tab = await getActiveTab();
        const settings = await getSettings();
        const result = await sendContentMessage(tab.id, {
          type: "PROMPTLY_CONTENT_HEALTH",
          enabledSites: settings.enabledSites
        });
        sendResponse(result);
        return;
      }
      case "PROMPTLY_REWRITE": {
        const result = await requestRewrite(message.payload || {});
        sendResponse(result);
        return;
      }
      case "PROMPTLY_ADD_HISTORY": {
        const settings = await getSettings();
        if (!settings.historyEnabled) {
          sendResponse({ ok: true, skipped: true });
          return;
        }
        await addHistoryEntry(message.entry);
        sendResponse({ ok: true });
        return;
      }
      case "PROMPTLY_GET_HISTORY": {
        const entries = await getHistory();
        sendResponse({ ok: true, entries });
        return;
      }
      case "PROMPTLY_CLEAR_HISTORY": {
        await clearHistory();
        sendResponse({ ok: true });
        return;
      }
      case "PROMPTLY_OPEN_SIDE_PANEL": {
        const tab = await getActiveTab();
        if (chrome.sidePanel && chrome.sidePanel.open) {
          await chrome.sidePanel.open({ tabId: tab.id });
        }
        sendResponse({ ok: true });
        return;
      }
      default:
        sendResponse({ ok: false, error: "Unknown message type" });
    }
  })().catch((error) => {
    sendResponse({ ok: false, error: error.message || "Unexpected background error" });
  });

  return true;
});
