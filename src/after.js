"use strict";
// @ts-check

/**
 * Reads the stored settings
 * @param {(items: Array<{repo: string, url: string}>) => void} callback
 */
const getRepoSettings = (callback) => {
  chrome.storage.sync.get(
    {
      repoPaths: "[]",
    },
    (items) => {
      let result;
      try {
        result = JSON.parse(items.repoPaths || "[]");
      } catch (e) {}
      callback(Array.isArray(result) ? result : []);
    }
  );
};

addEventListener(
  "click",
  (event) => {
    const { target } = event;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    // PR BRANCH LINK
    if (target.matches(".pr-header-branches a:first-child")) {
      event.preventDefault();
      const branch = target.innerText.trim();
      setClipboard(branch).then(() => {
        target.classList.toggle("ce-clicked", true);
        setTimeout(() => {
          target.classList.toggle("ce-clicked", false);
        }, 300);
      });
    }
    // Code link
    if (target.matches(".repos-change-summary-file-icon-container + * *")) {
      const wrapper = target.closest(
        ".repos-change-summary-file-icon-container + *"
      );
      if (!wrapper || !(wrapper instanceof HTMLElement)) {
        return;
      }
      const lastChild = wrapper.lastChild;
      if (!lastChild || !(lastChild instanceof HTMLElement)) {
        return;
      }
      event.preventDefault();
      const file = lastChild.innerText.trim();
      getRepoSettings((repoSettings) => {
        const currentUrl = window.location.href.toLowerCase();
        const setting = repoSettings.find((row) =>
          currentUrl.startsWith(row.url.toLowerCase())
        );
        if (!setting) {
          alert(
            "No Repo Setting found for this URL - please open the options page."
          );
          return;
        }
        const repo = setting.repo;
        const vscodeUrl = `vscode://file/${repo}/${file}`;
        document.location.href = vscodeUrl;
      });
    }
  },
  true
);

function setClipboard(text) {
  const type = "text/plain";
  const blob = new Blob([text], { type });
  const data = [new ClipboardItem({ [type]: blob })];

  return navigator.clipboard.write(data);
}
