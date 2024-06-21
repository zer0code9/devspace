const { getConfig } = require('./lib/config');
const snippet = require('./lib/snippet');
const vscode = require('vscode');

function activate(context) {
	const extension = vscode.extensions.getExtension('SlashDEV.devspace');
	vscode.window.showInformationMessage('Hello from devspace!');

	// Snippet
	let Snippet = new snippet.SnippetHandler();
	Snippet.updateStatus(vscode.workspace.getConfiguration().get('devspace.snippet.allow'));
	
	vscode.window.showInformationMessage(Snippet.getStatus().text);
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(Snippet.updateStatus(vscode.workspace.getConfiguration().get('devspace.snippet.allow'))));
	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(Snippet.updateStatus(vscode.workspace.getConfiguration().get('devspace.snippet.allow'))));

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('devspace.snippet.allow')) {
			Snippet.updateStatus(vscode.workspace.getConfiguration().get('devspace.snippet.allow'));
			vscode.window.showInformationMessage(Snippet.getStatus().tooltip);
		}
	}))
	

	let snippetgo = vscode.commands.registerCommand('devspace.snippet.go', async () => {
		vscode.window.showInformationMessage('Getting your snippet languages.');
		vscode.commands.executeCommand('vscode.open', vscode.Uri.file('settings.json'));
		vscode.commands.executeCommand('vscode.editorScroll', 'devspace.snippet.languages')
	});
	context.subscriptions.push(snippetgo);

	let disposable = vscode.commands.registerCommand('devspace.hello', function () {
		vscode.window.showInformationMessage('Hello from Dev Space!');
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}