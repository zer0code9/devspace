import * as vscode from 'vscode';
import { Config, getConfig } from './lib/config';
import { window, workspace, TextEditor, StatusBarItem, StatusBarAlignment } from 'vscode';

let config: Config = {
    snippetsLanguages: [],
    allowSnippets: true
}

class SnippetHandler {
    editor: TextEditor;
    status: StatusBarItem;

    constructor() {
        this.editor = undefined;
        this.status = window.createStatusBarItem(StatusBarAlignment.Right);
    }

    updateStatus(active: boolean): void {
        const icon = active ? '$(check)' : '$(circle-slash)'
        const message = active ? "Snippets are enabled" : "Snippets are not enabled";
        this.status.text = `${icon} DevSpace`
        this.status.tooltip = message;
        this.status.show();
    }
}

export function activate(context: vscode.ExtensionContext) {
    const command = 'devspace.snippets';

    const commandHandler = (name: string = 'world') => {
        console.log(`Hello ${name}!!!`);
    };

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}