import * as vscode from 'vscode';
import NodeStatus from './src/nodeStatus';
import NodeViewProvider from './src/nodeView';
import NodePath from './src/nodePath';

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let nodePath = new NodePath();
	context.subscriptions.push(vscode.workspace.getConfiguration('devspace').update('nodeRoot', nodePath.getNodePathAsString(), true));
	let nodeViewProvider = new NodeViewProvider(nodePath);
	context.subscriptions.push(vscode.window.createTreeView('devspace.nodeView', { treeDataProvider: nodeViewProvider }));

	let nodeStatus = new NodeStatus(nodePath.getNodeRoot());
	context.subscriptions.push(nodeStatus);

	context.subscriptions.push(vscode.commands.registerCommand('devspace.refreshNodeView', () => {
		nodePath.setNodeRoot(vscode.workspace.getConfiguration('devspace').get('nodeRoot'));
		nodeViewProvider.setNodePath(nodePath);
		context.subscriptions.push(vscode.window.createTreeView('devspace.nodeView', { treeDataProvider: nodeViewProvider }));
		nodeStatus.update(vscode.workspace.getConfiguration('devspace').get('nodeRoot'));
		nodeViewProvider.refresh();
	}))

	context.subscriptions.push(vscode.commands.registerCommand('devspace.deleteNodeItem', () => {
		vscode.window.showInformationMessage('Does nothing yet');
	}))

	context.subscriptions.push(vscode.commands.registerCommand('devspace.deleteNodeItem', () => {
		vscode.window.showInformationMessage('Does nothing yet');
	}))

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
		if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
			vscode.window.showInformationMessage('No workspace folders. Node View is not available.');
			vscode.workspace.getConfiguration('devspace').update('nodeRoot', null, true);
		} else {
			vscode.workspace.workspaceFolders.map(folder => {
				if (e.uri.fsPath.startsWith(folder.uri.fsPath)) {
					vscode.workspace.getConfiguration('devspace').update('nodeRoot', folder.uri.fsPath, true);
				}
			});

			if (!vscode.workspace.getConfiguration('devspace').get('nodeRoot')) {
				vscode.window.showInformationMessage('Invalid node root (workspace folder). Node View is not available.');
			} else {
				vscode.commands.executeCommand('devspace.refreshNodeView');
			}
		}
	}))

}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}