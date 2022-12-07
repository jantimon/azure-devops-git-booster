"use strict";
// @ts-check
const inlineScript = document.createElement("script");
inlineScript.src = chrome.runtime.getURL("ide-link/web_accessible.js");

// use dom mutation observer to detect when head is added to the dom
// and then add the style tag to the head
waitForNode(document.documentElement, (head) => {
  if (!head.matches("head")) {
    return false;
  }
  head.appendChild(inlineScript);
  return true;
});

// Global Click listener
// Listen for LineNumber clicks
// This is only for the PR Summary page which does not use
// the monaco editor
//
// The monaco editor line numbers clicks are handled in inline.js
addEventListener(
  "click",
  (event) => {
    const { target } = event;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    // Line Number
    if (target.matches(".repos-line-number")) {
      const lineNumber = target.dataset.line || target.dataset.lineNumber;
      const codeWrapper = target.closest([
        // For Code in PR Summary
        ".repos-summary-header",
        // For Code in PR Comment
        ".bolt-timeline-cell-content"
      ].join(","));
      if (
        !lineNumber ||
        !codeWrapper ||
        !(codeWrapper instanceof HTMLElement)
      ) {
        return;
      }
      // The header containing the file name doesn't have a class or id so we need to find it by traversing the DOM
      const codeWrapperFileInfo = codeWrapper.querySelector(
        [
        // For Code in PR Summary
        ".repos-change-summary-file-icon-container + *",
        // For Code in PR Comment
        ".comment-file-header-link + *"
        ].join(", ")
      );
      if (
        !codeWrapperFileInfo ||
        !(codeWrapperFileInfo instanceof HTMLElement)
      ) {
        return;
      }
      const fileName = codeWrapperFileInfo.innerText
        .split("\n")
        .reverse()
        .find((text) => text.startsWith("/"));
      if (!fileName) {
        return;
      }
      openIde({ fileName, lineNumber });
      event.preventDefault();
    }
  },
  true
);

/**
 * Listen for INLINE_SCRIPT_EVENT messages from the inline.js script
 */
addEventListener("message", ({ data }) => {
  if (
    data &&
    typeof data === "object" &&
    data.type === "INLINE_SCRIPT_EVENT" &&
    typeof data.lineNumber === "number" &&
    typeof data.fileName === "string"
  ) {
    const data = event.data;
    openIde({
      fileName: data.fileName,
      lineNumber: data.lineNumber,
    });
  }
});

/**
 * Wait for a node to be added to the DOM until
 * the check function returns true
 * @param {HTMLElement} scope
 * @param {(element: HTMLElement)=>boolean} check
 */
function waitForNode(scope, check) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement && check(node)) {
          observer.disconnect();
          break;
        }
      }
    }
  });
  observer.observe(scope, { childList: true, subtree: true });
}

/**
 * Reads the stored settings
 * @param {(options: { repoPaths: Array<{repo: string, url: string, prefix: string}>, debug: boolean }) => void} callback
 */
function getRepoSettings(callback) {
  chrome.storage.sync.get(
    {
      repoPaths: "[]",
      debug: false,
    },
    (items) => {
      let result;
      try {
        result = JSON.parse(items.repoPaths || "[]");
      } catch (e) {}
      callback({
        repoPaths: Array.isArray(result) ? result : [],
        debug: items.debug || false,
      });
    }
  );
}

/**
 * Launches the IDE
 *
 * @param {{ fileName: string, lineNumber: string | number }} options
 */
function openIde({ fileName, lineNumber }) {
  getRepoSettings((settings) => {
    const currentUrl = window.location.href.toLowerCase();
    const setting = settings.repoPaths.find((row) =>
      currentUrl.startsWith(row.url.toLowerCase())
    );
    if (!setting || !setting.repo || !setting.prefix) {
      // Call the background.js file as the open options page
      // API does not work in the content_script.js browser sandbox script
      chrome.runtime.sendMessage("OPEN_OPTIONS_PAGE");
      return;
    }
    const repo = setting.repo;
    const ideUrl = `${setting.prefix}/${repo}/${fileName}:${lineNumber}:1`;
    console.log("Opening IDE", ideUrl);
    document.location.href = ideUrl;
  });
}

function setClipboard(text) {
  const type = "text/plain";
  const blob = new Blob([text], { type });
  const data = [new ClipboardItem({ [type]: blob })];
  return navigator.clipboard.write(data);
}
