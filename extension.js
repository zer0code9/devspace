const { config, getConfig } = require('./src/lib/config')
const vscode = require('vscode');

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
        this.editor = vscode.window.activeTextEditor;
        this.status = vscode.window.createStatusBarItem(StatusBarAlignment.Right);
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

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "test" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('test.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from test!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
