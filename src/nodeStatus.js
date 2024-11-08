import * as vscode from 'vscode';

class NodeStatus {
    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.text = '$(cross) Node View';
        this.statusBarItem.tooltip = 'No Node Path';
        this.statusBarItem.show();
    }

    update(nodePath) {
        this.statusBarItem.text = nodePath ? '$(check) Node View' : '$(cross) Node View';
        this.statusBarItem.tooltip = nodePath ? `Current Node Path: ${nodePath}` : 'No Node Path';
    }
}

module.exports = NodeStatus;