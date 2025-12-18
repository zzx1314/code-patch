const vscode = acquireVsCodeApi();
const chat = document.getElementById("chat");
const input = document.getElementById("input");

let currentContainer = null;
let currentMarkdown = "";

// 发送消息
function send() {
  const text = input.value.trim();
  if (!text) return;
  appendMessage("user", escapeHtml(text));
  input.value = "";
  vscode.postMessage({ type: "ask", text });
}

// 回车发送
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

// 接收流式消息
window.addEventListener("message", (e) => {
  const msg = e.data;

  if (msg.type === "start") {
    currentMarkdown = "";
    currentContainer = document.createElement("div");
    currentContainer.className = "ai-msg";
    chat.appendChild(currentContainer);
  }

  if (msg.type === "stream") {
    currentMarkdown += msg.text;
    renderMarkdown(currentContainer, currentMarkdown);
  }

  if (msg.type === "end") {
    highlightCode();
  }
});

function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.innerHTML = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function renderMarkdown(el, markdown) {
  el.innerHTML = marked.parse(markdown);
  chat.scrollTop = chat.scrollHeight;
}

function highlightCode() {
  document.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[m]);
}
