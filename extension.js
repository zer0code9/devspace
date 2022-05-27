import { config, getConfig } from './src/lib/config';
import { window, commands, Position, TreeItem, DiagnosticCollection, Diagnostic, Uri } from 'vscode';
import fs from 'fs';
import path from 'path';

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

export class ProblemDependenciesProvider {
	workspaceRoot;

	constructor(workspaceRoot) {
		this.workspaceRoot = workspaceRoot;
	}

	getTreeItem(element) {
		return element;
	}

	getChildren(element) {
		if(!this.workspaceRoot) {
			getVSCodeDownloadUrl.window.showInformationMessage('Empty workspace')
			return Promise.resolve([]);
		}

		if (element) {
			return Promise.resolve(
				this.getFileProblems(
					path.join(this.workspaceRoot, element.label)
				)
			);
		}
	}

	getFiles() {
		return Promise.resolve(
			this.getFileProblems(
				path.join()
			)
		)
	}

	getFileProblems() {
		DiagnosticCollection.forEach((call) => {
			var uri = call.uri.fsPath
			return new ProblemHandler(uri.substring(), )
		})
	}
}

class ProblemHandler extends TreeItem {
	constructor(label, rPath, collapse) {
		super(label, collapse);
		this.tooltip = `${label}-${rPath}`;
		this.description = rPath;
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