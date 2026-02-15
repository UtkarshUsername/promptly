(() => {
  const ADAPTERS = [
    {
      domain: "chatgpt.com",
      name: "ChatGPT",
      selectors: ["#prompt-textarea", "textarea[data-id='root']", "main textarea"]
    },
    {
      domain: "claude.ai",
      name: "Claude",
      selectors: ["div[contenteditable='true']", "textarea"]
    },
    {
      domain: "gemini.google.com",
      name: "Gemini",
      selectors: ["div[contenteditable='true']", "textarea"]
    },
    {
      domain: "chat.deepseek.com",
      name: "DeepSeek",
      selectors: ["textarea", "div[contenteditable='true']"]
    }
  ];

  function findAdapter() {
    const host = window.location.hostname;
    return ADAPTERS.find((adapter) => host.includes(adapter.domain)) || null;
  }

  function isSiteEnabled(enabledSites = {}) {
    const host = window.location.hostname;
    const globalEnabled = enabledSites["*"] !== false;
    const specific = Object.keys(enabledSites).find((key) => host.includes(key));

    if (!globalEnabled) {
      return false;
    }
    if (!specific) {
      return true;
    }
    return enabledSites[specific] !== false;
  }

  function queryEditableBySelectors(selectors) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (node) {
        return node;
      }
    }
    return null;
  }

  function getActiveEditableElement() {
    const el = document.activeElement;
    if (!el) {
      return null;
    }

    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      return el;
    }

    if (el.isContentEditable) {
      return el;
    }

    return null;
  }

  function readTextFromElement(el) {
    if (!el) {
      return "";
    }

    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      return (el.value || "").trim();
    }

    if (el.isContentEditable) {
      return (el.innerText || el.textContent || "").trim();
    }

    return "";
  }

  function writeTextToElement(el, text) {
    if (!el) {
      return false;
    }

    el.focus();

    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      el.value = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    if (el.isContentEditable) {
      el.textContent = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }

    return false;
  }

  function captureFromPage(enabledSites) {
    const selection = window.getSelection()?.toString()?.trim() || "";
    if (selection) {
      return {
        ok: true,
        text: selection,
        source: "selection",
        adapter: null
      };
    }

    if (!isSiteEnabled(enabledSites)) {
      return {
        ok: false,
        error: "Promptly is disabled for this site in settings."
      };
    }

    const adapter = findAdapter();
    if (adapter) {
      const element = queryEditableBySelectors(adapter.selectors);
      const text = readTextFromElement(element);
      if (text) {
        return {
          ok: true,
          text,
          source: "site_adapter",
          adapter: adapter.name
        };
      }
    }

    const active = getActiveEditableElement();
    const activeText = readTextFromElement(active);
    if (activeText) {
      return {
        ok: true,
        text: activeText,
        source: "focused_field",
        adapter: adapter?.name || "generic"
      };
    }

    return {
      ok: false,
      error: "No selected text or supported editable field found."
    };
  }

  function insertIntoPage(text, enabledSites) {
    if (!text) {
      return {
        ok: false,
        error: "No text to insert."
      };
    }

    if (!isSiteEnabled(enabledSites)) {
      return {
        ok: false,
        error: "Promptly is disabled for this site in settings."
      };
    }

    const adapter = findAdapter();
    if (adapter) {
      const element = queryEditableBySelectors(adapter.selectors);
      if (writeTextToElement(element, text)) {
        return {
          ok: true,
          source: "site_adapter",
          adapter: adapter.name
        };
      }
    }

    const active = getActiveEditableElement();
    if (writeTextToElement(active, text)) {
      return {
        ok: true,
        source: "focused_field",
        adapter: adapter?.name || "generic"
      };
    }

    return {
      ok: false,
      error: "Could not insert text into this editor."
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    try {
      if (message?.type === "PROMPTLY_CONTENT_CAPTURE") {
        sendResponse(captureFromPage(message.enabledSites || {}));
        return true;
      }

      if (message?.type === "PROMPTLY_CONTENT_INSERT") {
        sendResponse(insertIntoPage(message.text || "", message.enabledSites || {}));
        return true;
      }

      sendResponse({ ok: false, error: "Unknown content message type" });
      return true;
    } catch (error) {
      sendResponse({ ok: false, error: error.message || "Content script error" });
      return true;
    }
  });
})();
