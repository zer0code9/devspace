import * as vscode from 'vscode';

interface Project {
    name: string,
    path: string,
    category: string
}

export class ProjectBoxStatus {
    constructor(private statusBarItem: vscode.StatusBarItem) {
        this.update();
        this.statusBarItem.show();
    }

    update(): void {
        const projects: Project[] | undefined = vscode.workspace.getConfiguration('devspace').get('projects');
        if (!vscode.workspace.getConfiguration('devspace').get('categorizeProjects')) {
            this.statusBarItem.text = `$(devspace-project-container) ${projects ? projects.length : 0}`;
            this.statusBarItem.tooltip = `Click to open Project Box | ${projects ? projects.length : 0}`;
        } else {
            const categories: string[] | undefined = vscode.workspace.getConfiguration('devspace').get('projectCategories');
            this.statusBarItem.text = `$(devspace-project-container) ${categories ? categories.length : 0}: ${projects ? projects.length : 0}`;
            if (categories) {
                let projectCategory = "";
                for (const category of categories) {
                    if (projectCategory) {
                        projectCategory += `, ${category}: ${projects ? projects.filter(project => project.category === category).length : 0}`;
                    } else {
                        projectCategory = `${category}: ${projects ? projects.filter(project => project.category === category).length : 0}`;
                    }
                }
                this.statusBarItem.tooltip = `Click to open Project Box | ${projectCategory}`;
            }
        }
        this.statusBarItem.command = 'devspace.showProjectBox';
    }
}