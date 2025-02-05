"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectBoxStatus = void 0;
const fs = require("fs");
const vscode = require("vscode");
class ProjectBoxStatus {
    constructor(statusBarItem) {
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
    pathExists(p) {
        try {
            fs.accessSync(p);
        }
        catch (err) {
            return false;
        }
        return true;
    }
}
exports.ProjectBoxStatus = ProjectBoxStatus;
//# sourceMappingURL=ProjectBoxStatus.js.map