import * as vscode from 'vscode';

class NodeStatus {
    constructor(nodeRoot) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.update(nodeRoot);
        this.statusBarItem.show();
    }

    update(nodeRoot) {
        this.statusBarItem.text = nodeRoot ? '$(check) Node View' : '$(cross) Node View';
        this.statusBarItem.tooltip = nodeRoot ? `Node Root: ${nodeRoot}` : 'No Node Root';
    }
}

module.exports = NodeStatus;