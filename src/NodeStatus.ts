import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class NodeStatus {
    private statusBarItem: vscode.StatusBarItem;
    constructor(nodeRoot: string | undefined) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.update(nodeRoot);
        this.statusBarItem.show();
    }

    update(nodeRoot: string | undefined) {
        const exists = this.pathExists(path.join(`${nodeRoot}`, 'package.json'));
        this.statusBarItem.text = exists ? '$(check) Node View' : '$(cross) Node View';
        this.statusBarItem.tooltip = exists ? `Node Root: ${nodeRoot}` : 'No Node Root';
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