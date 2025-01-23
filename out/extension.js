"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const NodeViewProvider_1 = require("./NodeViewProvider");
const NodeStatus_1 = require("./NodeStatus");
function activate(context) {
    const nodeRoot = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    vscode.workspace.getConfiguration('devspace').update('nodeRoot', nodeRoot, true);
    vscode.window.registerTreeDataProvider('devspace.nodeView', new NodeViewProvider_1.NodeViewProvider(nodeRoot));
    const nodeStatus = new NodeStatus_1.NodeStatus(nodeRoot);
    context.subscriptions.push(nodeStatus.getStatusBarItem());
    const nodeViewProvider = new NodeViewProvider_1.NodeViewProvider(nodeRoot);
    vscode.window.registerTreeDataProvider('devspace.nodeView', nodeViewProvider);
    vscode.commands.registerCommand('devspace.refreshNodeView', () => {
        vscode.window.showInformationMessage('Refreshing node view');
        nodeViewProvider.refresh();
    });
    vscode.commands.registerCommand('devspace.updateNodeItem', node => {
        const terminal = vscode.window.createTerminal({ name: `Devspace Terminal` });
        terminal.show();
        terminal.sendText(`sudo npm install --save-dev ${node.name}`, true);
        vscode.window.showInformationMessage(`Updated ${node.name}`);
        vscode.commands.executeCommand('devspace.refreshNodeView');
    });
    vscode.commands.registerCommand('devspace.uninstallNodeItem', node => {
        const terminal = vscode.window.createTerminal({ name: `Devspace Terminal` });
        terminal.show();
        terminal.sendText(`sudo npm uninstall ${node.name}`, true);
        vscode.window.showInformationMessage(`Uninstalled ${node.name}`);
        vscode.commands.executeCommand('devspace.refreshNodeView');
    });
    vscode.commands.registerCommand('devspace.openNodeItem', node => {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${node.name}`));
    });
    vscode.commands.registerCommand('devspace.showNodeRoot', () => {
        vscode.window.showInformationMessage(`${vscode.workspace.getConfiguration('devspace').get('nodeRoot')}`);
    });
    vscode.commands.registerCommand('devspace.showNodeView', () => {
        vscode.commands.executeCommand('devspace.nodeView.focus');
    });
}
function deactivate() { }
//# sourceMappingURL=extension.js.map