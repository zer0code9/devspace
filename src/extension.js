import { config, getConfig } from './lib/config';
import { SnippetHandler } from './lib/snippet'
import { MonoExplorerProvider } from './lib/mono'
import { window, workspace, commands, Position, TreeItem, Uri } from 'vscode';
import fs from 'fs';
import path from 'path';

function activate(context) {

	// Snippet
	let Snippet = new SnippetHandler();
	Snippet.updateStatus(getConfig()[1]);

	commands.registerCommand('devspace.snippet.go', async () => {
		window.showInformationMessage('Getting your snippets.');
		commands.executeCommand('vscode.open', Uri.file('settings.json'));
		commands.executeCommand('vscode.editorScroll', 'devspace.snippet.languages')
	});
	context.subscriptions.push(Snippet.getStatus());
	context.subscriptions.push(window.onDidChangeActiveTextEditor(Snippet.updateStatus(getConfig()[1])));
	context.subscriptions.push(window.onDidChangeTextEditorSelection(Snippet.updateStatus(getConfig()[1])));

	// Mono
	const roothPath = getConfig()[2];
	let Mono = new MonoExplorerProvider(roothPath);
	window.createTreeView('monoexplorer', {treeDataProvider: Mono});
	commands.registerCommand('devspace.mono.refresh', async () => {Mono.refresh();});

	commands.registerCommand('devspace.mono.change', async () => {
		const value = window.showInputBox({ prompt: 'Enter path to workspace' });
		workspace.getConfiguration('devspace.mono').update('workspace', value);
		Mono.changePath(value);
	})

	context.subscriptions.push(workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('devspace.mono.workspace')) {
			commands.executeCommand('devspace.mono.change');
		}
		if (e.affectsConfiguration('devspace.snippet.allow')) {
			Snippet.updateStatus(getConfig()[1]);
		}
	}))
}

// this method is called when your extension is deactivated
function deactivate() {}

export default {
	activate,
	deactivate,
}