import * as vscode from 'vscode';

export class ProjectBoxStatus {
    constructor(private statusBarItem: vscode.StatusBarItem) {
        this.update();
        this.statusBarItem.show();
    }

    update(): void {
        const projects: string[] | undefined = vscode.workspace.getConfiguration('devspace').get('projects');
        this.statusBarItem.text = `$(devspace-box) ${projects ? projects.length : 0}`;
        this.statusBarItem.command = 'devspace.showProjectBox';
        this.statusBarItem.tooltip = `Click to open Project Box`;
    }
}