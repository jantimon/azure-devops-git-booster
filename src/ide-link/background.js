// @ts-check

/** @type {string | undefined} */
let url;
/** @type {string | undefined} */
let extensionId;
chrome.management.getSelf().then((info) => (extensionId = info.id));

// The openOptionsPage works only in the background.js file
// Therefore we listen for events from the content_script.js file
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== extensionId) {
    return;
  }
  if (message === "OPEN_OPTIONS_PAGE") {
    url = sender.url;
    chrome.runtime.openOptionsPage();
  }
  if (message === "GET_LATEST_OPTIONS_OPENER") {
    sendResponse(url || "");
  }
});
