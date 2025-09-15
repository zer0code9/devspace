import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class NodeStatus {
    constructor(private statusBarItem: vscode.StatusBarItem) {
        this.update();
        this.statusBarItem.show();
    }

    update(): void {
        const nodeRoot: string | undefined = vscode.workspace.getConfiguration('devspace').get('nodeRoot');
        const exists: boolean = this.pathExists(path.join(`${nodeRoot}`, 'package.json'));
        this.statusBarItem.text = exists ? '$(devspace-check) Node View' : '$(devspace-cross) Node View';
        this.statusBarItem.tooltip = (exists ? `Node Root: ${nodeRoot}` : 'No Node Root') + " | " + this.getPMCommand();
        this.statusBarItem.command = 'devspace.nodeView.focus';
    }

    getPMCommand(): string {
        const packageManager: string | undefined = vscode.workspace.getConfiguration('devspace').get('packageManager');
        const securedRoot: boolean | undefined = vscode.workspace.getConfiguration('devspace').get('securedRoot');
        return securedRoot ? `sudo ${packageManager}` : `${packageManager}`;
    }

    pathExists(path: string): boolean {
        try {
            fs.accessSync(path);
        } catch (err) {
            return false;
        }
        return true;
    }
}