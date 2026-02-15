export const DEFAULT_SETTINGS = {
  openRouterApiKey: "",
  openRouterModel: "openai/gpt-4o-mini",
  rulesOnlyMode: false,
  historyEnabled: false,
  enabledSites: {
    "chatgpt.com": true,
    "claude.ai": true,
    "gemini.google.com": true,
    "chat.deepseek.com": true,
    "*": true
  }
};

export const INTENTS = ["write", "analyze", "summarize", "code", "brainstorm", "other"];

export const SCORE_LABELS = {
  needs_work: { min: 0, max: 59, title: "Needs work" },
  fair: { min: 60, max: 79, title: "Fair" },
  strong: { min: 80, max: 100, title: "Strong" }
};

export const HISTORY_KEY = "promptHistory";
export const SETTINGS_KEY = "settings";
export const MAX_HISTORY_ITEMS = 50;
