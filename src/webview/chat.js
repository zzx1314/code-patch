const vscode = acquireVsCodeApi();

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");

sendBtn.addEventListener("click", send);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

function send() {
  const text = input.value.trim();
  if (!text) return;

  add("You", text);
  vscode.postMessage({ type: "ask", text });
  input.value = "";
}

let currentAI = null;

window.addEventListener("message", e => {
  const msg = e.data;

  if (msg.type === "start") {
    currentAI = document.createElement("div");
    currentAI.innerHTML = "<b>AI:</b><pre></pre>";
    chat.appendChild(currentAI);
  }

  if (msg.type === "stream") {
    const pre = currentAI.querySelector("pre");
    pre.textContent += msg.text;
    chat.scrollTop = chat.scrollHeight;
  }

  if (msg.type === "end") {
    currentAI = null;
  }
});

function add(role, text) {
  const p = document.createElement("p");
  p.innerHTML = `<b>${role}:</b> ${text}`;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}
