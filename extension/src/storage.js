import { DEFAULT_SETTINGS, HISTORY_KEY, MAX_HISTORY_ITEMS, SETTINGS_KEY } from "./constants.js";

function storageGet(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

function storageSet(payload) {
  return new Promise((resolve) => {
    chrome.storage.local.set(payload, resolve);
  });
}

export async function getSettings() {
  const result = await storageGet([SETTINGS_KEY]);
  return {
    ...DEFAULT_SETTINGS,
    ...(result[SETTINGS_KEY] || {}),
    enabledSites: {
      ...DEFAULT_SETTINGS.enabledSites,
      ...(result[SETTINGS_KEY]?.enabledSites || {})
    }
  };
}

export async function saveSettings(nextSettings) {
  const merged = {
    ...DEFAULT_SETTINGS,
    ...nextSettings,
    enabledSites: {
      ...DEFAULT_SETTINGS.enabledSites,
      ...(nextSettings.enabledSites || {})
    }
  };
  await storageSet({ [SETTINGS_KEY]: merged });
  return merged;
}

export async function updateSettings(patch) {
  const current = await getSettings();
  return saveSettings({
    ...current,
    ...patch,
    enabledSites: {
      ...current.enabledSites,
      ...(patch.enabledSites || {})
    }
  });
}

export async function getHistory() {
  const result = await storageGet([HISTORY_KEY]);
  return Array.isArray(result[HISTORY_KEY]) ? result[HISTORY_KEY] : [];
}

export async function addHistoryEntry(entry) {
  const history = await getHistory();
  const next = [entry, ...history].slice(0, MAX_HISTORY_ITEMS);
  await storageSet({ [HISTORY_KEY]: next });
  return next;
}

export async function clearHistory() {
  await storageSet({ [HISTORY_KEY]: [] });
}
