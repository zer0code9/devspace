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
        this.statusBarItem.text = `$(devspace-box) ${projects ? projects.length : 0}`;
        this.statusBarItem.command = 'devspace.showProjectBox';
        this.statusBarItem.tooltip = `Click to open Project Box`;
    }
}
exports.ProjectBoxStatus = ProjectBoxStatus;
//# sourceMappingURL=ProjectBoxStatus.js.map