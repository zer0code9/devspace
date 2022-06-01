import { config, getConfig } from './config';
import { window, commands, Position, TreeItem, DiagnosticCollection, Diagnostic, Uri } from 'vscode';
import fs from 'fs';
import path from 'path';

export class ProblemDependenciesProvider {
	workspaceRoot;

	constructor(workspaceRoot) {
		this.workspaceRoot = workspaceRoot;
	}

	getTreeItem(element) {
		return element;
	}

	getFile(element) {
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
        
    }

	getFileProblems() {
		DiagnosticCollection.forEach((call) => {
			var uri = call.uri.fsPath
			return new ProblemHandler(uri.substring(), )
		})
	}
}

export class ProblemHandler extends TreeItem {
	constructor(label, rPath, collapse) {
		super(label, collapse);
		this.tooltip = `${label}-${rPath}`;
		this.description = rPath;
	}
}