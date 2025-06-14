"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeStatus = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
class NodeStatus {
    constructor(statusBarItem) {
        this.statusBarItem = statusBarItem;
        this.update();
        this.statusBarItem.show();
    }
    update() {
        const nodeRoot = vscode.workspace.getConfiguration('devspace').get('nodeRoot');
        const exists = this.pathExists(path.join(`${nodeRoot}`, 'package.json'));
        this.statusBarItem.text = exists ? '$(devspace-check) Node View' : '$(devspace-cross) Node View';
        this.statusBarItem.tooltip = (exists ? `Node Root: ${nodeRoot}` : 'No Node Root') + " | " + this.getPMCommand();
        this.statusBarItem.command = 'devspace.nodeView.focus';
    }
    getPMCommand() {
        const packageManager = vscode.workspace.getConfiguration('devspace').get('packageManager');
        if (packageManager === "bun") {
            return "bun";
        }
        const securedRoot = vscode.workspace.getConfiguration('devspace').get('securedRoot');
        return securedRoot ? `sudo ${packageManager}` : `${packageManager}`;
    }
    pathExists(path) {
        try {
            fs.accessSync(path);
        }
        catch (err) {
            return false;
        }
        return true;
    }
}
exports.NodeStatus = NodeStatus;
//# sourceMappingURL=NodeStatus.js.map