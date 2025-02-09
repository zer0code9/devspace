import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class NodeStatus {
    private statusBarItem: vscode.StatusBarItem;
    
    constructor(statusBarItem: vscode.StatusBarItem) {
        this.statusBarItem = statusBarItem;
        this.update();
        this.statusBarItem.show();
    }

    update() {
        const nodeRoot = vscode.workspace.getConfiguration('devspace').get('nodeRoot');
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