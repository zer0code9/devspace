"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
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
    vscode.commands.registerCommand('devspace.showProjectBox', () => {
        const proJectBoxPick = vscode.window.createQuickPick();
        proJectBoxPick.title = 'Project Box';
        proJectBoxPick.placeholder = 'Your projects';
        const projects = vscode.workspace.getConfiguration('devspace').get('projects');
        let projectSelect = [];
        projects.map((item) => {
            projectSelect.push({ label: item });
        });
        proJectBoxPick.items = projectSelect;
        proJectBoxPick.onDidAccept(() => proJectBoxPick.hide());
        proJectBoxPick.onDidHide(() => proJectBoxPick.hide());
        proJectBoxPick.show();
    });
    vscode.commands.registerCommand('devspace.addFoldersBox', () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const folderPick = vscode.window.createQuickPick();
        folderPick.title = 'Add Folders to Box';
        folderPick.placeholder = 'Select folder(s)';
        const projects = vscode.workspace.getConfiguration('devspace').get('projects');
        let folderSelect = [];
        if (workspaceFolders) {
            workspaceFolders.map((item) => {
                if (!projects.includes(item.uri.fsPath)) {
                    folderSelect.push({ label: item.uri.fsPath });
                }
            });
        }
        folderPick.items = folderSelect;
        folderPick.canSelectMany = true;
        folderPick.onDidChangeSelection(async (items) => {
            items.map((item) => {
                if (!projects.includes(item.label)) {
                    projects.push(item.label);
                }
            });
            await vscode.workspace.getConfiguration('devspace').update('projects', projects, true);
            projectBoxStatus.update();
        });
        folderPick.onDidAccept(() => folderPick.hide());
        folderPick.onDidHide(() => folderPick.hide());
        folderPick.show();
    });
    vscode.commands.registerCommand('devspace.removeFoldersBox', () => {
        const folderPick = vscode.window.createQuickPick();
        folderPick.title = 'Remove Folders from Box';
        folderPick.placeholder = 'Select folder(s)';
        const projects = vscode.workspace.getConfiguration('devspace').get('projects');
        let folderSelect = [];
        projects.map((item) => {
            folderSelect.push({ label: item });
        });
        folderPick.items = folderSelect;
        folderPick.canSelectMany = true;
        folderPick.onDidChangeSelection(async (items) => {
            items.map((item) => {
                if (projects.includes(item.label)) {
                    projects.splice(projects.indexOf(item.label), 1);
                }
            });
            await vscode.workspace.getConfiguration('devspace').update('projects', projects, true);
            projectBoxStatus.update();
        });
        folderPick.onDidAccept(() => folderPick.hide());
        folderPick.onDidHide(() => folderPick.hide());
        folderPick.show();
    });
    vscode.commands.registerCommand('devspace.addFoldersWorkspace', () => {
        const folderPick = vscode.window.createQuickPick();
        folderPick.title = 'Add Folder to Workspace';
        folderPick.placeholder = 'Select folder';
        const projects = vscode.workspace.getConfiguration('devspace').get('projects');
        let folderSelect = [];
        projects.map((item) => {
            folderSelect.push({ label: item });
        });
        folderPick.items = folderSelect;
        folderPick.canSelectMany = false;
        folderPick.onDidChangeSelection(items => {
            vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.parse(items[0].label) });
        });
        folderPick.onDidAccept(() => folderPick.hide());
        folderPick.onDidHide(() => folderPick.hide());
        folderPick.show();
    });
    vscode.commands.registerCommand('devspace.removeFoldersWorkspace', () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const folderPick = vscode.window.createQuickPick();
        folderPick.title = 'Remove Folder from Workspace';
        folderPick.placeholder = 'Select folder';
        let folderSelect = [];
        if (workspaceFolders) {
            workspaceFolders.map((item) => {
                folderSelect.push({ label: item.uri.fsPath });
            });
        }
        folderPick.items = folderSelect;
        folderPick.canSelectMany = false;
        folderPick.onDidChangeSelection(items => {
            const folderToRemove = workspaceFolders?.find(folder => folder.uri.fsPath === items[0].label);
            if (folderToRemove && workspaceFolders) {
                vscode.workspace.updateWorkspaceFolders(workspaceFolders?.indexOf(folderToRemove), 1);
            }
        });
        folderPick.onDidAccept(() => folderPick.hide());
        folderPick.onDidHide(() => folderPick.hide());
        folderPick.show();
    });
    vscode.window.onDidChangeActiveTextEditor(editorE => {
        const filePath = editorE?.document.fileName;
        let folderPath = filePath?.slice(0, filePath.lastIndexOf('/'));
        let index = folderPath?.lastIndexOf('/');
        if (index === -1 || !index) {
            return;
        }
        let folderName = folderPath?.slice(index + 1);
        let areSame = false;
        let count = 9;
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
        if (areSame) {
            const newNodeRoot = folderPath;
            vscode.workspace.getConfiguration('devspace').update('nodeRoot', newNodeRoot, true);
            onChangeEvent(newNodeRoot, nodeViewProvider, nodeStatus);
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
function deactivate() { }
//# sourceMappingURL=extension.js.map