const codeTabs = document.querySelectorAll("#codeTabs .panel-tab");
const htmlEditor = document.getElementById("htmlEditor");
const cssEditor = document.getElementById("cssEditor");
const jsEditor = document.getElementById("jsEditor");
const editorArea = document.getElementById("editorArea");
const activeFileLabel = document.getElementById("activeFileLabel");
const lineCountLabel = document.getElementById("lineCount");
const previewFrame = document.getElementById("previewFrame");
const previewRefresh = document.getElementById("previewRefresh");
const previewArea = document.getElementById("previewArea");
const runButton = document.getElementById("runButton");
const modeButtons = document.querySelectorAll(".mode-toggle-btn");
const panelLeft = document.querySelector(".panel-left");
const panelRight = document.querySelector(".panel-right");
const splitter = document.getElementById("splitter");
const themeToggle = document.getElementById("themeToggle");
const saveButton = document.getElementById("saveButton");
const downloadButton = document.getElementById("downloadButton");
const autosaveStatus = document.getElementById("autosaveStatus");

let activeEditor = "html";
let isDragging = false;
let startX = 0;
let startLeftWidth = 0;

const STORAGE_KEYS = {
  html: "yonni_html",
  css: "yonni_css",
  js: "yonni_js",
  theme: "yonni_theme"
};

function setActiveEditor(name) {
  activeEditor = name;
  codeTabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.editor === name);
  });

  htmlEditor.style.display = name === "html" ? "block" : "none";
  cssEditor.style.display = name === "css" ? "block" : "none";
  jsEditor.style.display = name === "js" ? "block" : "none";

  editorArea.classList.remove("editor-active");
  void editorArea.offsetWidth;
  editorArea.classList.add("editor-active");

  if (name === "html") activeFileLabel.textContent = "index.html";
  if (name === "css") activeFileLabel.textContent = "style.css";
  if (name === "js") activeFileLabel.textContent = "script.js";

  updateLineCount();
}

function updateLineCount() {
  let text = "";
  if (activeEditor === "html") text = htmlEditor.value;
  if (activeEditor === "css") text = cssEditor.value;
  if (activeEditor === "js") text = jsEditor.value;

  const lines = text.split("\n").length;
  lineCountLabel.textContent = "Lines: " + lines;
}

function buildPreviewContent() {
  const html = htmlEditor.value;
  const css = "<style>" + cssEditor.value + "</style>";
  const js = "<script>" + jsEditor.value.replace(/<\/script>/gi, "<\\/script>") + "<\/script>";
  return html
    .replace("</head>", css + "</head>")
    .replace("</body>", js + "</body>");
}

function updatePreview() {
  const content = buildPreviewContent();
  previewFrame.srcdoc = content;

  previewArea.classList.remove("preview-pulse");
  void previewArea.offsetWidth;
  previewArea.classList.add("preview-pulse");

  previewRefresh.classList.add("show");
  setTimeout(() => {
    previewRefresh.classList.remove("show");
  }, 900);
}

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.html, htmlEditor.value);
    localStorage.setItem(STORAGE_KEYS.css, cssEditor.value);
    localStorage.setItem(STORAGE_KEYS.js, jsEditor.value);
    autosaveStatus.textContent = "Autosave: saved";
    setTimeout(() => {
      autosaveStatus.textContent = "Autosave: on";
    }, 1500);
  } catch (e) {
    console.warn("LocalStorage save failed", e);
  }
}

function loadFromLocalStorage() {
  try {
    const html = localStorage.getItem(STORAGE_KEYS.html);
    const css = localStorage.getItem(STORAGE_KEYS.css);
    const js = localStorage.getItem(STORAGE_KEYS.js);

    if (html !== null) htmlEditor.value = html;
    if (css !== null) cssEditor.value = css;
    if (js !== null) jsEditor.value = js;
  } catch (e) {
    console.warn("LocalStorage load failed", e);
  }
}

function applySavedTheme() {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.theme);
    if (theme === "light") {
      document.body.classList.remove("theme-dark");
      document.body.classList.add("theme-light");
    } else {
      document.body.classList.remove("theme-light");
      document.body.classList.add("theme-dark");
    }
  } catch (e) {
    console.warn("Theme load failed", e);
  }
}

function toggleTheme() {
  const isDark = document.body.classList.contains("theme-dark");
  if (isDark) {
    document.body.classList.remove("theme-dark");
    document.body.classList.add("theme-light");
    localStorage.setItem(STORAGE_KEYS.theme, "light");
  } else {
    document.body.classList.remove("theme-light");
    document.body.classList.add("theme-dark");
    localStorage.setItem(STORAGE_KEYS.theme, "dark");
  }
}

function downloadSingleHTML() {
  const content = buildPreviewContent();
  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "yonni-project.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

htmlEditor.addEventListener("input", () => {
  updateLineCount();
  updatePreview();
  saveToLocalStorage();
});

cssEditor.addEventListener("input", () => {
  updateLineCount();
  updatePreview();
  saveToLocalStorage();
});

jsEditor.addEventListener("input", () => {
  updateLineCount();
  updatePreview();
  saveToLocalStorage();
});

codeTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    setActiveEditor(tab.dataset.editor);
  });
});

runButton.addEventListener("click", () => {
  updatePreview();
});

modeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    modeButtons.forEach(b => b.classList.toggle("active", b === btn));

    if (mode === "both") {
      panelLeft.style.display = "flex";
      panelRight.style.display = "flex";
      splitter.style.display = "flex";
    } else if (mode === "code") {
      panelLeft.style.display = "flex";
      panelRight.style.display = "none";
      splitter.style.display = "none";
    } else if (mode === "preview") {
      panelLeft.style.display = "none";
      panelRight.style.display = "flex";
      splitter.style.display = "none";
    }
  });
});

splitter.addEventListener("mousedown", (e) => {
  isDragging = true;
  startX = e.clientX;
  startLeftWidth = panelLeft.getBoundingClientRect().width;
  document.body.style.cursor = "col-resize";
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const dx = e.clientX - startX;
  const newLeftWidth = startLeftWidth + dx;
  const containerWidth = document.querySelector(".main").getBoundingClientRect().width;
  const minWidth = containerWidth * 0.25;
  const maxWidth = containerWidth * 0.75;

  const clamped = Math.max(minWidth, Math.min(maxWidth, newLeftWidth));
  panelLeft.style.flex = "0 0 " + clamped + "px";
  panelRight.style.flex = "1 1 auto";
});

window.addEventListener("mouseup", () => {
  if (!isDragging) return;
  isDragging = false;
  document.body.style.cursor = "default";
});

themeToggle.addEventListener("click", () => {
  toggleTheme();
});

saveButton.addEventListener("click", () => {
  saveToLocalStorage();
});

downloadButton.addEventListener("click", () => {
  downloadSingleHTML();
});

applySavedTheme();
loadFromLocalStorage();
setActiveEditor("html");
updatePreview();
