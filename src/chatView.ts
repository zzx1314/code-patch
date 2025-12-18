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
        const reply = await this.callOllama(msg.text);
        webview.postMessage({
          type: "reply",
          text: reply
        });
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
}
