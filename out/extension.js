"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const fs = require("fs");
const NodeViewProvider_1 = require("./NodeViewProvider");
const NodeStatus_1 = require("./NodeStatus");
const ProjectBoxStatus_1 = require("./ProjectBoxStatus");
function activate(context) {
    const nodeRoot = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    vscode.workspace.getConfiguration('devspace').update('nodeRoot', nodeRoot, true);
    const nodeViewProvider = new NodeViewProvider_1.NodeViewProvider(nodeRoot);
    vscode.window.registerTreeDataProvider('devspace.nodeView', nodeViewProvider);
    const nodeStatus = new NodeStatus_1.NodeStatus(vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100), nodeRoot);
    const projectBoxStatus = new ProjectBoxStatus_1.ProjectBoxStatus(vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100));
    //const previousFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 ? vscode.workspace.workspaceFolders[0].uri.fsPath : "";
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
    vscode.commands.registerCommand('devspace.showProjectBox', () => {
        vscode.window.showInformationMessage(`ProjectBox`);
    });
    vscode.commands.registerCommand('devspace.addFolders', () => {
        vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: true,
        }).then(fileUri => {
            if (fileUri && fileUri[0]) {
                vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: fileUri[0] });
            }
        });
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
function onChangeEvent(nodeRoot, nodeViewProvider, nodeStatus) {
    nodeViewProvider.setNodeRoot(nodeRoot);
    nodeStatus.update(nodeRoot);
    vscode.commands.executeCommand('devspace.refreshNodeView');
}
function pathExists(path) {
    try {
        fs.accessSync(path);
    }
    catch (err) {
        return false;
    }
    return true;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map