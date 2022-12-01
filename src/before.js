const style = document.createElement("style")
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


  .repos-change-summary-file-icon-container + * {
    cursor: pointer;
    transition: background 300ms; 
  }
  .repos-change-summary-file-icon-container + *:hover {
    background: snow;
  }
`
document.documentElement.appendChild(style);