import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class NodeStatus {
    private statusBarItem: vscode.StatusBarItem;
    
    constructor(statusBarItem: vscode.StatusBarItem, nodeRoot: string | undefined) {
        this.statusBarItem = statusBarItem;
        this.update(nodeRoot);
        this.statusBarItem.show();
    }

    update(nodeRoot: string | undefined) {
        const exists = this.pathExists(path.join(`${nodeRoot}`, 'package.json'));
        this.statusBarItem.text = exists ? '$(devspace-check) Node View' : '$(devspace-cross) Node View';
        this.statusBarItem.tooltip = exists ? `Node Root: ${nodeRoot}` : 'No Node Root';
        this.statusBarItem.command = 'devspace.nodeView.focus';
    }

    getStatusBarItem() {
        return this.statusBarItem;
    }

    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }
        return true;
    }
}