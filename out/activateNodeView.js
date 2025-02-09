"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateNodeView = activateNodeView;
const vscode = require("vscode");
const NodeViewProvider_1 = require("./NodeViewProvider");
const NodeStatus_1 = require("./NodeStatus");
function activateNodeView() {
    const nodeRoot = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    vscode.workspace.getConfiguration('devspace').update('nodeRoot', nodeRoot, true);
    const nodeViewProvider = new NodeViewProvider_1.NodeViewProvider();
    vscode.window.registerTreeDataProvider('devspace.nodeView', nodeViewProvider);
    const nodeStatus = new NodeStatus_1.NodeStatus(vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100));
    vscode.commands.registerCommand('devspace.refreshNodeView', () => {
        nodeViewProvider.refresh();
    });
    vscode.commands.registerCommand('devspace.installNodeItem', () => {
        const inputBox = vscode.window.createInputBox();
        inputBox.placeholder = 'NPM/YARN package name';
        inputBox.show();
        inputBox.onDidAccept(() => {
            const node = inputBox.value;
            inputBox.hide();
            const terminal = vscode.window.createTerminal({ name: `Devspace Terminal` });
            terminal.show();
            const installer = vscode.workspace.getConfiguration('devspace').get('installer');
            if (installer === "npm") {
                terminal.sendText(`npm install --save-dev ${node}`, true);
            }
            else if (installer === "yarn") {
                terminal.sendText(`yarn add --dev ${node}`, true);
            }
            else if (installer === "sudonpm") {
                terminal.sendText(`sudo npm install --save-dev ${node}`, true);
            }
            else {
                terminal.sendText(`Invalid installer. Please use npm/yarn/sudonpm`, false);
            }
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
        const installer = vscode.workspace.getConfiguration('devspace').get('installer');
        if (installer === "npm") {
            terminal.sendText(`npm install --save-dev ${node.name}`, true);
        }
        else if (installer === "yarn") {
            terminal.sendText(`yarn add --dev ${node.name}`, true);
        }
        else if (installer === "sudonpm") {
            terminal.sendText(`sudo npm install --save-dev ${node.name}`, true);
        }
        else {
            terminal.sendText(`Invalid installer. Please use npm/yarn/sudonpm`, false);
        }
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
        const installer = vscode.workspace.getConfiguration('devspace').get('installer');
        if (installer === "npm") {
            terminal.sendText(`npm uninstall ${node.name}`, true);
        }
        else if (installer === "yarn") {
            terminal.sendText(`yarn remove ${node.name}`, true);
        }
        else if (installer === "sudonpm") {
            terminal.sendText(`sudo npm uninstall ${node.name}`, true);
        }
        else {
            terminal.sendText(`Invalid installer. Please use npm/yarn/sudonpm`, false);
        }
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
    vscode.window.onDidChangeActiveTextEditor(async (editorE) => {
        const filePath = editorE?.document.fileName;
        let areSame = false;
        let count = 9;
        let folderPath;
        let index;
        let folderName;
        if (filePath?.includes('/')) {
            folderPath = filePath?.slice(0, filePath.lastIndexOf('/'));
            index = folderPath?.lastIndexOf('/');
            if (index === -1 || !index) {
                return;
            }
            folderName = folderPath?.slice(index + 1);
            while (!areSame && count > 0 && (index !== -1 && index) && folderName) {
                vscode.workspace.workspaceFolders?.forEach(workspaceFolder => {
                    if (workspaceFolder.name === `${folderName}`) {
                        areSame = true;
                    }
                });
                if (!areSame) {
                    folderPath = folderPath?.slice(0, folderPath.lastIndexOf('/'));
                    index = folderPath?.lastIndexOf('/');
                    if (index === -1 || !index) {
                        break;
                    }
                    folderName = folderPath?.slice(index + 1);
                    count--;
                }
            }
        }
        else if (filePath?.includes('\\')) {
            folderPath = filePath?.slice(0, filePath.lastIndexOf('\\'));
            index = folderPath?.lastIndexOf('\\');
            if (index === -1 || !index) {
                return;
            }
            folderName = folderPath?.slice(index + 1);
            while (!areSame && count > 0 && (index !== -1 && index) && folderName) {
                vscode.workspace.workspaceFolders?.forEach(workspaceFolder => {
                    if (workspaceFolder.name === `${folderName}`) {
                        areSame = true;
                    }
                });
                if (!areSame) {
                    folderPath = folderPath?.slice(0, folderPath.lastIndexOf('\\'));
                    index = folderPath?.lastIndexOf('\\');
                    if (index === -1 || !index) {
                        break;
                    }
                    folderName = folderPath?.slice(index + 1);
                    count--;
                }
            }
        }
        if (areSame) {
            const newNodeRoot = folderPath;
            await vscode.workspace.getConfiguration('devspace').update('nodeRoot', newNodeRoot, true);
            nodeViewProvider.update();
            nodeStatus.update();
            vscode.commands.executeCommand('devspace.refreshNodeView');
        }
    });
}
//# sourceMappingURL=activateNodeView.js.map