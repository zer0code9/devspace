import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class ProjectBoxStatus {
    private statusBarItem: vscode.StatusBarItem;
    
    constructor(statusBarItem: vscode.StatusBarItem) {
        this.statusBarItem = statusBarItem;
        this.update();
        this.statusBarItem.show();
    }

    update() {
        const active = vscode.workspace.getConfiguration('devspace').get('activeProjects');
        const inactive = vscode.workspace.getConfiguration('devspace').get('inactiveProjects');
        this.statusBarItem.text = `$(devspace-box) ${active.length}`;
        this.statusBarItem.command = 'devspace.showProjectBox';
        this.statusBarItem.tooltip = `Click to see Project Box (doesn't work)`;
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