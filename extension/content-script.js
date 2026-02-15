(() => {
  const REASON_MESSAGES = {
    READY: "Adapter is ready.",
    SITE_DISABLED: "Promptly is disabled for this site in settings.",
    EDITOR_NOT_FOUND: "No supported compose editor was detected.",
    UNSUPPORTED_EDITOR: "Editor is present but not writable by this adapter.",
    NO_TEXT_FOUND: "Editor is empty or no text is selected.",
    NO_SELECTION: "No text is selected.",
    INSERT_FAILED: "Could not insert text into this editor.",
    NO_TARGET: "No editable target is available."
  };

  const ADAPTERS = [
    {
      id: "chatgpt",
      domain: "chatgpt.com",
      name: "ChatGPT",
      selectors: [
        "#prompt-textarea",
        "textarea[data-id='root']",
        "textarea[placeholder*='Message']",
        "main textarea"
      ]
    },
    {
      id: "claude",
      domain: "claude.ai",
      name: "Claude",
      selectors: [
        "div[contenteditable='true'][role='textbox']",
        "div[contenteditable='true'][data-testid*='composer']",
        "div[contenteditable='true'][data-is-editable='true']",
        "textarea"
      ]
    },
    {
      id: "gemini",
      domain: "gemini.google.com",
      name: "Gemini",
      selectors: [
        "div[contenteditable='true'][role='textbox']",
        "div[contenteditable='true'][aria-label*='prompt']",
        "textarea"
      ]
    },
    {
      id: "deepseek",
      domain: "chat.deepseek.com",
      name: "DeepSeek",
      selectors: [
        "textarea",
        "div[contenteditable='true'][role='textbox']",
        "div[contenteditable='true']"
      ]
    }
  ];

  function toSingleLine(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function isVisible(element) {
    if (!element) {
      return false;
    }
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getEditorType(element) {
    if (!element) {
      return "none";
    }
    if (element instanceof HTMLTextAreaElement) {
      return "textarea";
    }
    if (element instanceof HTMLInputElement) {
      return "input";
    }
    if (element.isContentEditable) {
      return "contenteditable";
    }
    return "custom";
  }

  function findAdapterForHost() {
    const host = window.location.hostname;
    return ADAPTERS.find((adapter) => host.includes(adapter.domain)) || null;
  }

  function isSiteEnabled(enabledSites = {}) {
    const host = window.location.hostname;
    if (enabledSites["*"] === false) {
      return false;
    }

    const siteKey = Object.keys(enabledSites).find((key) => key !== "*" && host.includes(key));
    if (!siteKey) {
      return true;
    }

    return enabledSites[siteKey] !== false;
  }

  function queryFirstVisible(selectors) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (node && isVisible(node)) {
        return node;
      }
    }
    return null;
  }

  function getActiveEditable() {
    const active = document.activeElement;
    if (!active) {
      return null;
    }
    if (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement || active.isContentEditable) {
      return active;
    }
    return null;
  }

  function detectEditorContext(enabledSites = {}) {
    const host = window.location.hostname;
    const adapter = findAdapterForHost();
    const enabled = isSiteEnabled(enabledSites);

    if (!enabled) {
      return {
        ok: false,
        host,
        adapter_id: adapter?.id || "generic",
        adapter_name: adapter?.name || "Generic",
        reason: "SITE_DISABLED",
        message: REASON_MESSAGES.SITE_DISABLED,
        editor_type: "none"
      };
    }

    const adapterElement = adapter ? queryFirstVisible(adapter.selectors) : null;
    if (adapter && adapterElement) {
      return {
        ok: true,
        host,
        adapter_id: adapter.id,
        adapter_name: adapter.name,
        mode: "site_adapter",
        reason: "READY",
        message: REASON_MESSAGES.READY,
        editor_type: getEditorType(adapterElement),
        element: adapterElement
      };
    }

    const active = getActiveEditable();
    if (active && isVisible(active)) {
      return {
        ok: true,
        host,
        adapter_id: adapter?.id || "generic",
        adapter_name: adapter?.name || "Generic",
        mode: "focused_field",
        reason: "READY",
        message: REASON_MESSAGES.READY,
        editor_type: getEditorType(active),
        element: active
      };
    }

    const generic = queryFirstVisible(["textarea", "input[type='text']", "div[contenteditable='true']"]);
    if (generic) {
      return {
        ok: true,
        host,
        adapter_id: "generic",
        adapter_name: "Generic",
        mode: "generic",
        reason: "READY",
        message: REASON_MESSAGES.READY,
        editor_type: getEditorType(generic),
        element: generic
      };
    }

    return {
      ok: false,
      host,
      adapter_id: adapter?.id || "generic",
      adapter_name: adapter?.name || "Generic",
      reason: "EDITOR_NOT_FOUND",
      message: REASON_MESSAGES.EDITOR_NOT_FOUND,
      editor_type: "none"
    };
  }

  function selectionWithin(element) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return "";
    }

    const text = toSingleLine(selection.toString());
    if (!text) {
      return "";
    }

    if (!element) {
      return text;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const inElement = container === element || element.contains(container.nodeType === Node.TEXT_NODE ? container.parentNode : container);

    return inElement ? text : "";
  }

  function readText(element) {
    if (!element) {
      return "";
    }

    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      return toSingleLine(element.value);
    }

    if (element.isContentEditable) {
      return toSingleLine(element.innerText || element.textContent || "");
    }

    return "";
  }

  function setNativeValue(input, value) {
    const prototype = Object.getPrototypeOf(input);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor && typeof descriptor.set === "function") {
      descriptor.set.call(input, value);
    } else {
      input.value = value;
    }
  }

  function writeToInput(element, text) {
    if (!(element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement)) {
      return false;
    }

    element.focus();
    setNativeValue(element, text);
    element.dispatchEvent(new InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function writeToContentEditable(element, text) {
    if (!element || !element.isContentEditable) {
      return false;
    }

    element.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
    range.deleteContents();

    const lines = String(text || "").split("\n");
    const fragment = document.createDocumentFragment();

    lines.forEach((line, index) => {
      if (index > 0) {
        fragment.appendChild(document.createElement("br"));
      }
      fragment.appendChild(document.createTextNode(line));
    });

    range.insertNode(fragment);
    selection.removeAllRanges();

    element.dispatchEvent(new InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function writeText(element, text) {
    if (!element) {
      return false;
    }

    if (writeToInput(element, text)) {
      return true;
    }

    if (writeToContentEditable(element, text)) {
      return true;
    }

    return false;
  }

  function getHealth(enabledSites) {
    const context = detectEditorContext(enabledSites);
    return {
      ok: true,
      host: context.host,
      adapter_id: context.adapter_id,
      adapter_name: context.adapter_name,
      status: context.reason,
      supported: Boolean(context.ok),
      editor_type: context.editor_type,
      mode: context.mode || "none",
      message: context.message
    };
  }

  function captureFromPage(enabledSites) {
    const context = detectEditorContext(enabledSites);
    const health = getHealth(enabledSites);

    if (!context.ok && context.reason === "SITE_DISABLED") {
      return {
        ok: false,
        error: context.message,
        reason: context.reason,
        health
      };
    }

    const globalSelection = toSingleLine(window.getSelection()?.toString() || "");
    if (globalSelection) {
      return {
        ok: true,
        text: globalSelection,
        source: "selection",
        adapter: context.adapter_name,
        health
      };
    }

    if (!context.ok) {
      return {
        ok: false,
        error: context.message,
        reason: context.reason,
        health
      };
    }

    const selectedInEditor = selectionWithin(context.element);
    if (selectedInEditor) {
      return {
        ok: true,
        text: selectedInEditor,
        source: "selection",
        adapter: context.adapter_name,
        health
      };
    }

    const draft = readText(context.element);
    if (draft) {
      return {
        ok: true,
        text: draft,
        source: context.mode,
        adapter: context.adapter_name,
        health
      };
    }

    return {
      ok: false,
      error: REASON_MESSAGES.NO_TEXT_FOUND,
      reason: "NO_TEXT_FOUND",
      health
    };
  }

  function insertIntoPage(text, enabledSites) {
    const context = detectEditorContext(enabledSites);
    const health = getHealth(enabledSites);

    if (!text || !text.trim()) {
      return {
        ok: false,
        reason: "NO_TEXT_FOUND",
        error: "No text to insert.",
        health
      };
    }

    if (!context.ok || !context.element) {
      return {
        ok: false,
        reason: context.reason || "NO_TARGET",
        error: context.message || REASON_MESSAGES.NO_TARGET,
        health
      };
    }

    if (!writeText(context.element, text)) {
      return {
        ok: false,
        reason: "INSERT_FAILED",
        error: REASON_MESSAGES.INSERT_FAILED,
        health
      };
    }

    return {
      ok: true,
      source: context.mode,
      adapter: context.adapter_name,
      health
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

      if (message?.type === "PROMPTLY_CONTENT_HEALTH") {
        sendResponse(getHealth(message.enabledSites || {}));
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
