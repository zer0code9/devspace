import { config, getConfig } from './lib/config';
import { SnippetHandler } from './lib/snippet'
import { MonoExplorerProvider } from './lib/mono'
import { window, commands, Position, TreeItem, DiagnosticCollection, Diagnostic, Uri } from 'vscode';
import fs from 'fs';
import path from 'path';

function activate(context) {

	// Snippet
	let Snippet = new SnippetHandler();
	Snippet.updateStatus(getConfig()[1]);

	commands.registerCommand('devspace.snippet.go', async () => {
		commands.executeCommand('vscode.open', Uri.file('settings.json'));
		commands.executeCommand('vscode.editorScroll', 'devspace.snippet.languages')
		window.showInformationMessage('Getting your snippets.');
	});

	// Mono
	const roothPath = getConfig()[2];
	let Mono = new MonoExplorerProvider(roothPath);
	window.createTreeView('monoExplorer', {treeDataProvider: Mono});
	commands.registerCommand('devspace.mono.refresh', async () => {Mono.refresh();});
}

// this method is called when your extension is deactivated
function deactivate() {}

export default {
	activate,
	deactivate,
}