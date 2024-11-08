const vscode = require('vscode');
const NodeView = require('./src/nodeView');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const initialNodePath = vscode.workspace ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
	const initialNodeViewProvider = new NodeView(initialNodePath);
	context.subscriptions.push(vscode.window.createTreeView('devspace.nodeView', { treeDataProvider: initialNodeViewProvider }));

	let nodeStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	nodeStatusBar.text = 'Node View';
	nodeStatusBar.tooltip = initialNodePath;
	nodeStatusBar.show();
	context.subscriptions.push(nodeStatusBar);

	context.subscriptions.push(vscode.commands.registerCommand('devspace.refreshNodeView', () => {
		const nodePath = vscode.workspace.getConfiguration('devspace').get('nodePath');
		const nodeViewProvider = new NodeView(nodePath);
		context.subscriptions.push(vscode.window.createTreeView('devspace.nodeView', { treeDataProvider: nodeViewProvider }));
		NodeView.refresh(nodeViewProvider);
	}))

	context.subscriptions.push(vscode.commands.registerCommand('devspace.deleteNodeItem', () => {
		vscode.window.showInformationMessage('DDoes nothing yet');
		//NodeView.delete(nodeViewProvider);
	}))

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
		if (!vscode.workspace.workspaceFolders) {
			vscode.window.showInformationMessage('No workspace folders. Node View is not available.');
		} else {
			const filePath = e.uri.fsPath;

			vscode.workspace.workspaceFolders.map(folder => {
				if (filePath.startsWith(folder.uri.fsPath)) {
					vscode.workspace.getConfiguration('devspace').update('nodePath', folder.uri.fsPath, true);
				}
			});

			if (!vscode.workspace.getConfiguration('devspace').get('nodePath')) {
				vscode.window.showInformationMessage('Invalid node path. Node View is not available.');
			} else {
				vscode.commands.executeCommand('devspace.refreshNodeView');
				const nodePath = vscode.workspace.getConfiguration('devspace').get('nodePath');
		
				nodeStatusBar.tooltip = nodePath;
				context.subscriptions.push(nodeStatusBar);
			}
		}
	}))

}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}