import * as vscode from "vscode";

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codePatch.chat";

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "ask") {
        const reply = await this.callOllama(msg.text);
        webviewView.webview.postMessage({
          type: "reply",
          text: reply
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
        stream: false
      })
    });

    const data: any = await res.json();
    return data.response ?? "";
  }

  getHtml(webview: vscode.Webview) {
    return `
<!DOCTYPE html>
<html>
<body>
  <div id="chat"></div>
  <textarea id="input" rows="3"></textarea>
  <button onclick="send()">Send</button>

  <script>
    const vscode = acquireVsCodeApi();

    function send() {
      const text = input.value;
      add("You", text);
      vscode.postMessage({ type: "ask", text });
      input.value = "";
    }

    window.addEventListener("message", e => {
      if (e.data.type === "reply") {
        add("AI", e.data.text);
      }
    });

    function add(role, text) {
      chat.innerHTML += "<p><b>" + role + ":</b> " + text + "</p>";
    }
  </script>
</body>
</html>
`;
  }
}
