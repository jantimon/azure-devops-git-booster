// @ts-check
// This file runs outside of the content script sandbox
// and is injected into the page to get access to the monaco editor

/**
 * @param {import('monaco-editor')} monaco
 */
function start(monaco) {
  let fileName = "";
  /**
   * Listen to editor creation to get access to the editor events.
   * Will be called for every editor on the page
   *
   * @param {import('monaco-editor').editor.ICodeEditor | import('monaco-editor').editor.IStandaloneCodeEditor | import('monaco-editor').editor.IStandaloneDiffEditor} editor
   */
  function onEditorCreation(editor) {
    if (!("onMouseDown" in editor)) {
      return;
    }
    const updateFileName = () => {
      const newFilePath = editor.getModel()?.uri.path || "";
      // The diff editor has only the file nummer as path e.g. /34 for line 34
      if (!/^\/\d+$/.test(newFilePath)) {
        fileName = newFilePath.replace(/^\/git\/[^\/]*\/[^\/]*\//, "/");
      }
      return fileName;
    };
    updateFileName();
    editor.onDidChangeModel(updateFileName);
    editor.onMouseDown(({ target }) => {
      if (target.type !== monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
        return;
      }
      updateFileName();
      if (!fileName) {
        return;
      }
      const { lineNumber, column } = target.position;
      postMessage(
        { lineNumber, fileName, column, type: "INLINE_SCRIPT_EVENT" },
        "*"
      );
    });
  }

  monaco.editor.onDidCreateEditor(onEditorCreation);
}

// Wait until monaco was executed
waitForNode(document.head, (script) => {
  if (!(script instanceof HTMLScriptElement)) {
    return false;
  }
  if (!/(^|\/)monaco\./.test(script.src)) {
    return false;
  }
  script.addEventListener("load", () => {
    start(/** @type {any} */ (window).monaco);
  });
  return true;
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
