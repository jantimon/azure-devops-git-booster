// @ts-check

// The openOptionsPage works only in the background.js file
// Therefore we listen for events from the content_script.js file
chrome.runtime.onMessage.addListener(function (message) {
  if (message !== "OPEN_OPTIONS_PAGE") return;
  chrome.runtime.openOptionsPage();
});
