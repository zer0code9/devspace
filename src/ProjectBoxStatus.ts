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
        const projects: any = vscode.workspace.getConfiguration('devspace').get('projects');
        this.statusBarItem.text = `$(devspace-box) ${projects.length}`;
        this.statusBarItem.command = 'devspace.showProjectBox';
        this.statusBarItem.tooltip = `Click to open Project Box`;
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