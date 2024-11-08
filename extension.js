import * as vscode from 'vscode';
import NodeViewProvider from './src/nodeView';
import NodePath from './src/nodePath';
import NodeStatus from './src/nodeStatus';

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
		nodeStatus.update(vscode.workspace.getConfiguration('devspace').get('nodeRoot'));
		nodeViewProvider.refresh();
	}))

	context.subscriptions.push(vscode.commands.registerCommand('devspace.updateNode', () => {
		vscode.window.showInformationMessage('Does nothing yet');
	}))

	context.subscriptions.push(vscode.commands.registerCommand('devspace.deleteNode', () => {
		vscode.window.showInformationMessage('Does nothing yet');
	}))

	context.subscriptions.push(vscode.commands.registerCommand('devspace.openNode', (node) => {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${node.name}`));
	}))

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
		onChangeEvent(e);
	}))

	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(e => {
		onChangeEvent(e.document);
	}))

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('devspace.nodeRoot')) {
			onChangeEvent();
		}
	}))

}

function onChangeEvent(e) {
	if (e) {
		if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
			vscode.window.showInformationMessage('No workspace folders. Node View is not available.');
			vscode.workspace.getConfiguration('devspace').update('nodeRoot', null, true);
		} else {
			vscode.workspace.workspaceFolders.map(folder => {
				if (e.uri.fsPath.startsWith(folder.uri.fsPath) && e.languageId === 'json') {
					vscode.workspace.getConfiguration('devspace').update('nodeRoot', folder.uri.fsPath, true);
				}
			});
	
			if (!vscode.workspace.getConfiguration('devspace').get('nodeRoot')) {
				vscode.window.showInformationMessage('Invalid node root (workspace folder). Node View is not available.');
			} else {
				vscode.commands.executeCommand('devspace.refreshNodeView');
			}
		}
	} else {
		vscode.commands.executeCommand('devspace.refreshNodeView');
	}
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}