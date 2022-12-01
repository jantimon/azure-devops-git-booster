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

getRepoSettings((repoSettings) => {
    repoSettings.concat({ repo: "", url: "" }).forEach((rowValue) => createRepoSettingRow(rowValue));
});

let id = 0;

/**
 * Create an Input Row
 * @param {{repo?: string, url?: string}} row
 */
function createRepoSettingRow(row) {
    const form = document.querySelector("form");
    const submit = document.querySelector("form button[type=submit]");
    if (!form || !submit) {
        throw new Error("Form is missing");
    }
    const rowElement = document.createElement("div");
    rowElement.classList.add("row");
    rowElement.id = `row-${id++}`;
    // 2 Inputs for repo and url next to each other
    rowElement.innerHTML = `
        <input type="text" name="url" placeholder="URL - https://dev.azure.com/myRepo" value="${row.url || ""}" />
        <input type="text" name="repo" placeholder="Repo - /my/repo/root" value="${row.repo || ""}" />
        <button type="button" class="remove">Remove</button>
    `;
    // Prepend to form
    form.insertBefore(rowElement, submit);
    // Remove Button
    const removeButton = rowElement.querySelector("button.remove");
    if (removeButton) {
        removeButton.addEventListener("click", () => {
            rowElement.remove();
            if (form.querySelectorAll(".row").length === 0) {
                createRepoSettingRow({});
            }
        });
    }
    // Add another row once both inputs have a value
    const inputs = Array.from(rowElement.querySelectorAll("input[name=repo], input[name=url]"));
    inputs.forEach((input) => {
        input.addEventListener("input", () => {
            if (inputs.every((input) => getElementValue(input))) {
                if (!getRepoSettingsFromForm(form).some((row) => !row.repo && !row.url)) {
                    createRepoSettingRow({});
                }
            }
        });
    });
}

/**
 * @param {Element | null} element
 */
const getElementValue = (element) => {
    if (element instanceof HTMLInputElement) {
        return element.value.trim();
    }
    return "";
}

/**
 * @param {HTMLFormElement} form
 */
const getRepoSettingsFromForm = (form) => {
    const repoSettings = [];
    for (const row of form.querySelectorAll(".row")) {
        const repo = getElementValue(row.querySelector("input[name=repo]"));
        const url = getElementValue(row.querySelector("input[name=url]"));
        repoSettings.push({ repo, url });
    }
    return repoSettings;
}

addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) {
        throw new Error("Form is missing");
    }
    const repoSettings = getRepoSettingsFromForm(form).filter((row) => row.repo && row.url);
    chrome.storage.sync.set({ repoPaths: JSON.stringify(
        repoSettings
    ) }, () => {
        window.close();
    })
}, true)
