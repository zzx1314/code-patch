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

window.addEventListener("message", (e) => {
  if (e.data.type === "reply") {
    add("AI", e.data.text);
  }
});

function add(role, text) {
  const p = document.createElement("p");
  p.innerHTML = `<b>${role}:</b> ${text}`;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}
