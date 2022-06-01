import { config, getConfig } from './config';
import { window, commands, Position, TreeItem, DiagnosticCollection, Diagnostic, Uri } from 'vscode';
import fs from 'fs';
import path from 'path';

class MonoExplorerProvider {
	workspaceRoot;

	constructor(workspaceRoot) {
		this.workspaceRoot = workspaceRoot;
	}

	getTreeItem(element) {
		return element;
	}

	getChildren(element) {
		if(!this.workspaceRoot) {
			getVSCodeDownloadUrl.window.showInformationMessage('Need a workspace first.')
			return Promise.resolve([]);
		}

		if (this.pathExists(this.workspaceRoot)) {
			return Promise.resolve(
				this.getFiles()
			);
		} else {
            window.showInformationMessage("Workspace doesn't exist.")
            return Promise.resolve([]);
        }
	}

    getFiles() {
        const toRepo = () => {
            if (this.pathExists(this.workspaceRoot)) {
                return new SpaceHandler(path.dirname(this.workspaceRoot), this.workspaceRoot, vscode.TreeItemCollapsibleState.Collapsed)
            }
        }
        const repo = toRepo();
        return repo;
    }

    pathExists(path) {
        try {
            fs.accessSync(path)
        } catch (error) {
            return false;
        }
        return true;
    }
}

class SpaceHandler extends TreeItem {
	constructor(label, path, collapse) {
		super(label, collapse);
		this.tooltip = `${label}-${path}`;
		this.description = path;
	}
}

export default {
    SpaceHandler,
    MonoExplorerProvider
}