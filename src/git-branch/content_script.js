"use strict";
// @ts-check

const style = document.createElement("style");
style.innerHTML = `
  .pr-header-branches a:first-child {
    color: inherit;
  }
  .pr-header-branches a:first-child:after {
    content: " 🎯"
  }
  .pr-header-branches a.ce-clicked:after {
    content: " ✅"
  }
`;

document.documentElement.appendChild(style);

// Global Click listener
// Listen for clicks on the PR branch link
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
  },
  true
);
