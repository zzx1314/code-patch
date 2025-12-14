import * as vscode from "vscode";

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codePatch.chat";

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "ask") {
        const reply = await this.callOllama(msg.text);
        webviewView.webview.postMessage({
          type: "reply",
          text: reply,
        });
      }
    });
  }

  async callOllama(prompt: string): Promise<string> {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5-coder:7b",
        prompt,
        stream: false,
      }),
    });

    const data: any = await res.json();
    return data.response ?? "";
  }

  getHtml(webview: vscode.Webview) {
    return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      margin: 0;
      padding: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }

    header {
      padding: 8px 12px;
      font-weight: bold;
      border-bottom: 1px solid var(--vscode-editorGroup-border);
    }

    #chat {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .msg {
      margin-bottom: 12px;
      max-width: 90%;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }

    .user {
      align-self: flex-end;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      padding: 8px 12px;
      border-radius: 8px;
    }

    .ai {
      align-self: flex-start;
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-editorWidget-border);
      padding: 8px 12px;
      border-radius: 8px;
    }

    footer {
      display: flex;
      gap: 8px;
      padding: 8px;
      border-top: 1px solid var(--vscode-editorGroup-border);
    }

    textarea {
      flex: 1;
      resize: none;
      height: 48px;
      padding: 6px;
      font-family: inherit;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
    }

    button {
      padding: 0 14px;
      cursor: pointer;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <header>💬 CodePatch Chat</header>

  <div id="chat"></div>

  <footer>
    <textarea id="input" placeholder="Ask AI about your code..."></textarea>
    <button id="send">Send</button>
  </footer>

  <script>
    const vscode = acquireVsCodeApi();
    const chat = document.getElementById("chat");
    const input = document.getElementById("input");
    const sendBtn = document.getElementById("send");

    sendBtn.onclick = send;
    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    function send() {
      const text = input.value.trim();
      if (!text) return;
      addMessage("user", text);
      vscode.postMessage({ type: "ask", text });
      input.value = "";
    }

    window.addEventListener("message", e => {
      const msg = e.data;
      if (msg.type === "reply") {
        addMessage("ai", msg.text);
      }
    });

    function addMessage(role, text) {
      const div = document.createElement("div");
      div.className = "msg " + role;
      div.textContent = text;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }
  </script>
</body>
</html>
`;
  }
}
