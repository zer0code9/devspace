const vscode = require('vscode');

class SnippetHandler {
    status;

    constructor() {
        this.status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    }

    updateStatus(active) {
        const icon = active ? '$(check)' : '$(circle-slash)'
        const message = active ? "Snippets are enabled" : "Snippets are disabled";
        this.status.text = `${icon} DevSpace`
        this.status.tooltip = message;
        if (active) this.status.show(); else this.status.hide();
        return this.status;
    }

    check() {
        
    }

    getStatus() {
        return this.status;
    }
}

module.exports = { SnippetHandler };