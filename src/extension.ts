import * as vscode from "vscode";
import { ChatViewProvider } from "./chatView";
import { CHAT_VIEW_ID } from "./constants";

export function activate(context: vscode.ExtensionContext) {
  try {
    console.log("🔥 CodePatch activated");

    const provider = new ChatViewProvider(context);

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        CHAT_VIEW_ID,
        provider,
        {
          webviewOptions: {
            retainContextWhenHidden: true
          }
        }
      )
    );

    // 可选：方便调试
    (globalThis as any).__CODE_PATCH__ = {
      provider
    };

  } catch (err) {
    console.error("CodePatch activate failed", err);
    vscode.window.showErrorMessage("CodePatch 启动失败");
  }
}

export function deactivate() {
  console.log("🧹 CodePatch deactivated");
}
