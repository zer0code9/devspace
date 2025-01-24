import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { NodeViewProvider } from './NodeViewProvider';
import { NodeStatus } from './NodeStatus';

export function activate(context: vscode.ExtensionContext) {
	const nodeRoot = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
	vscode.workspace.getConfiguration('devspace').update('nodeRoot', nodeRoot, true);
	const nodeViewProvider = new NodeViewProvider(nodeRoot);
	vscode.window.registerTreeDataProvider('devspace.nodeView', nodeViewProvider);
	const nodeStatus = new NodeStatus(vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100), nodeRoot);

	//const previousFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 ? vscode.workspace.workspaceFolders[0].uri.fsPath : "";

	vscode.commands.registerCommand('devspace.refreshNodeView', () => {
		nodeViewProvider.refresh();
	});

	vscode.commands.registerCommand('devspace.installNodeItem', () => {
		const inputBox = vscode.window.createInputBox();
		inputBox.placeholder = 'NPM package name';
		inputBox.show();
		inputBox.onDidAccept(() => {
			const node = inputBox.value;
			inputBox.hide();
			const terminal = vscode.window.createTerminal({ name: `Devspace Terminal` });
			terminal.show();
			terminal.sendText(`sudo npm install --save-dev ${node}`, true);
			vscode.window.onDidEndTerminalShellExecution(terminalE => {
				if (terminalE.terminal.name === `Devspace Terminal`) {
					vscode.window.showInformationMessage(`Installed ${node}`);
					vscode.commands.executeCommand('devspace.refreshNodeView');
					terminal.dispose();
				}
			});
		});
	});

	vscode.commands.registerCommand('devspace.updateNodeItem', node => {
		const terminal = vscode.window.createTerminal({ name: `Devspace Terminal` });
		terminal.show();
		terminal.sendText(`sudo npm install --save-dev ${node.name}`, true);
		vscode.window.onDidEndTerminalShellExecution(terminalE => {
			if (terminalE.terminal.name === `Devspace Terminal`) {
				vscode.window.showInformationMessage(`Updated ${node.name}`);
				vscode.commands.executeCommand('devspace.refreshNodeView');
				terminal.dispose();
			}
		});
	});

	vscode.commands.registerCommand('devspace.uninstallNodeItem', node => {
		const terminal = vscode.window.createTerminal({ name: `Devspace Terminal` });
		terminal.show();
		terminal.sendText(`sudo npm uninstall ${node.name}`, true);
		vscode.window.onDidEndTerminalShellExecution(terminalE => {
			if (terminalE.terminal.name === `Devspace Terminal`) {
				vscode.window.showInformationMessage(`Uninstalled ${node.name}`);
				vscode.commands.executeCommand('devspace.refreshNodeView');
				terminal.dispose();
			}
		});
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

	vscode.window.onDidChangeActiveTextEditor(editorE => {
		const filePath = editorE?.document.fileName;
		const folderPath = filePath?.slice(0, filePath.lastIndexOf('/'));
		const folderName = folderPath?.slice(folderPath.lastIndexOf('/') + 1);
		let areSame = false;
		if (folderName) {
			vscode.workspace.workspaceFolders?.forEach(workspaceFolder => {
				if (workspaceFolder.name === `${folderName}` && !areSame) {
					areSame = true;
				}
			});
			if (areSame) {
				const newNodeRoot = folderPath;
				vscode.workspace.getConfiguration('devspace').update('nodeRoot', newNodeRoot, true);
				onChangeEvent(newNodeRoot, nodeViewProvider, nodeStatus);
			}
		}
	});

	vscode.workspace.onDidChangeConfiguration(configurationE => {
		if (configurationE.affectsConfiguration('devspace.nodeRoot')) {
			const newNodeRoot = vscode.workspace.getConfiguration('devspace').get('nodeRoot');
			onChangeEvent(`${newNodeRoot}`, nodeViewProvider, nodeStatus);
		}
	});
}

function onChangeEvent(nodeRoot: string | undefined, nodeViewProvider: NodeViewProvider, nodeStatus: NodeStatus) {
	nodeViewProvider.setNodeRoot(nodeRoot);
	nodeStatus.update(nodeRoot);
	vscode.commands.executeCommand('devspace.refreshNodeView');
}

function pathExists(path: string): boolean {
	try {
		fs.accessSync(path);
	} catch (err) {
		return false;
	}
	return true;
}

export function deactivate() {}