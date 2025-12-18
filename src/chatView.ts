import * as vscode from "vscode";
import * as fs from "fs";

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codePatch.chat";

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView) {
    const webview = view.webview;

    webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "src/webview")
      ]
    };

    webview.html = this.getHtml(webview);

    webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "ask") {
        webview.postMessage({ type: "start" });

        await this.callOllamaStream(msg.text, (chunk) => {
          webview.postMessage({
            type: "stream",
            text: chunk
          });
        });
        webview.postMessage({ type: "end" });
      }
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const baseUri = vscode.Uri.joinPath(
      this.context.extensionUri,
      "src",
      "webview"
    );

    const htmlPath = vscode.Uri.joinPath(baseUri, "chat.html");
    let html = fs.readFileSync(htmlPath.fsPath, "utf8");

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(baseUri, "chat.css")
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(baseUri, "chat.js")
    );

    html = html
      .replace("{{styleUri}}", styleUri.toString())
      .replace("{{scriptUri}}", scriptUri.toString())
      .replace(/{{cspSource}}/g, webview.cspSource);

    return html;
  }

  async callOllamaStream(prompt: string, onToken: (chunk: string) => void) {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5-coder:7b",
        prompt,
        stream: true
      })
    });

    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const json = JSON.parse(line);
          if (json.response) {
            onToken(json.response);
          }
          if (json.done) {
            return;
          }
        } catch (e) {
          // ignore broken chunk
        }
      }
    }
  }

}
