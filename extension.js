import { config, getConfig } from './src/lib/config';
import { window, commands, Position, TreeItem, DiagnosticCollection, Diagnostic, Uri } from 'vscode';
import fs from 'fs';
import path from 'path';

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
}