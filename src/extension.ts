import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("ai-helper activated!");
  const disposable = vscode.commands.registerCommand(
    "ai-helper.ask",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      const text = editor.document.getText(selection);
      if (!text) {
        vscode.window.showInformationMessage("请先选中一段代码！");
        return;
      }

      vscode.window.showInformationMessage("AI 正在生成...");

      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen2.5-coder:7b",
          prompt: text,
          stream: false, // 关键
        }),
      });

      if (!response.ok) {
        vscode.window.showErrorMessage("Ollama 请求失败");
        return;
      }

      const data: any = await response.json();

      const aiCode = data.response ?? "";

      await editor.edit((editBuilder) => {
        editBuilder.insert(
          selection.end,
          `\n\n/* AI 建议 */\n${aiCode}`
        );
      });
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
