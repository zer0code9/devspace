"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectBoxStatus = void 0;
const vscode = require("vscode");
class ProjectBoxStatus {
    constructor(statusBarItem) {
        this.statusBarItem = statusBarItem;
        this.update();
        this.statusBarItem.show();
    }
    update() {
        const projects = vscode.workspace.getConfiguration('devspace').get('projects');
        if (!vscode.workspace.getConfiguration('devspace').get('categorizeProjects')) {
            this.statusBarItem.text = `$(devspace-project-container) ${projects ? projects.length : 0}`;
            this.statusBarItem.tooltip = `Click to open Project Box | ${projects ? projects.length : 0}`;
        }
        else {
            const categories = vscode.workspace.getConfiguration('devspace').get('projectCategories');
            this.statusBarItem.text = `$(devspace-project-container) ${categories ? categories.length : 0}: ${projects ? projects.length : 0}`;
            if (categories) {
                let projectCategory = "";
                for (const category of categories) {
                    if (projectCategory) {
                        projectCategory += `, ${category}: ${projects ? projects.filter(project => project.category === category).length : 0}`;
                    }
                    else {
                        projectCategory = `${category}: ${projects ? projects.filter(project => project.category === category).length : 0}`;
                    }
                }
                this.statusBarItem.tooltip = `Click to open Project Box | ${projectCategory}`;
            }
        }
        this.statusBarItem.command = 'devspace.showProjectBox';
    }
}
exports.ProjectBoxStatus = ProjectBoxStatus;
//# sourceMappingURL=ProjectBoxStatus.js.map