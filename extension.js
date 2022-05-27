import { config, getConfig } from './src/lib/config';
import { window, commands, Position } from 'vscode';

let config = {
    // Snippets
    snippetsLanguages: [],
    allowSnippets: true
}

// SNIPPETS
class SnippetHandler {
    editor;
    status;

    constructor() {
        this.editor = window.activeTextEditor;
        this.status = window.createStatusBarItem(StatusBarAlignment.Right);
    }

    updateStatus(active) {
        const icon = active ? '$(check)' : '$(circle-slash)'
        const message = active ? "Snippets are enabled" : "Snippets are not enabled";
        this.status.text = `${icon} DevSpace`
        this.status.tooltip = message;
        this.status.show();
    }
}

function activate(context) {

	let disposable = commands.registerCommand('devspace.snippets', function () {
		commands.executeCommand('vscode.open', Uri.file('settings.json'));
		commands.executeCommand('vscode.editorScroll', 'devspace.snippet_langs')
		window.showInformationMessage('Getting your snippets.');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

export default {
	activate,
	deactivate,
    SnippetHandler,
    config
}