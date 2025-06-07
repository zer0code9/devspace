"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateNodeView = activateNodeView;
const vscode = require("vscode");
const path = require("path");
const NodeViewProvider_1 = require("./NodeViewProvider");
const NodeStatus_1 = require("./NodeStatus");
function activateNodeView() {
    /* VARIABLES */
    /* Node Root */
    const nodeRoot = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    vscode.workspace.getConfiguration('devspace').update('nodeRoot', nodeRoot, true);
    /* Node View Provider */
    const nodeViewProvider = new NodeViewProvider_1.NodeViewProvider();
    vscode.window.registerTreeDataProvider('devspace.nodeView', nodeViewProvider);
    /* Node Status */
    const nodeStatus = new NodeStatus_1.NodeStatus(vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100));
    // Other Variables
    const nodeHistory = [];
    /* COMMANDS */
    /**
     * Refresh Node View
     */
    vscode.commands.registerCommand('devspace.refreshNodeView', () => {
        nodeViewProvider.refresh();
    });
    /**
     * Open Node Folder
     * Configuration: Node Root
     */
    vscode.commands.registerCommand('devspace.openNodeFolder', () => {
        const nodeRoot = vscode.workspace.getConfiguration('devspace').get('nodeRoot');
        if (nodeRoot === undefined) {
            return;
        }
        vscode.workspace.openTextDocument(path.join(nodeRoot, 'package.json')).then(doc => {
            vscode.window.showTextDocument(doc);
        });
        vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.parse(nodeRoot) });
    });
    /**
     * Show Node History
     * Keybinding: Ctrl+Alt+H
     * Command: Open Node Folder
     */
    vscode.commands.registerCommand('devspace.showNodeHistory', () => {
        const nodeHistoryPick = vscode.window.createQuickPick();
        nodeHistoryPick.title = 'Node History';
        nodeHistoryPick.placeholder = (nodeHistory.length === 0) ? 'No node history' : 'Node history';
        let nodeSelect = [];
        nodeHistory.map((nodeRoot) => {
            nodeSelect.push({ label: nodeRoot });
        });
        nodeHistoryPick.items = nodeSelect;
        nodeHistoryPick.onDidAccept(() => {
            const nodeRoot = nodeHistoryPick.selectedItems[0].label;
            vscode.workspace.getConfiguration('devspace').update('nodeRoot', nodeRoot, true);
            nodeViewProvider.update();
            nodeStatus.update();
            nodeViewProvider.refresh();
            vscode.commands.executeCommand('devspace.openNodeFolder');
            nodeHistoryPick.hide();
        });
        nodeHistoryPick.onDidHide(() => { nodeHistoryPick.dispose(); });
        nodeHistoryPick.show();
    });
    /**
     * Add Node Item
     * Function: Get Terminal Command
     */
    vscode.commands.registerCommand('devspace.addNodeItem', () => {
        const inputBox = vscode.window.createInputBox();
        let dev = false;
        inputBox.placeholder = `Package name, adding with ${nodeStatus.getPMCommand()} to production dependencies`;
        inputBox.buttons = [
            {
                tooltip: "Production",
                iconPath: new vscode.ThemeIcon(`devspace-cross`)
            }
        ];
        inputBox.onDidTriggerButton(button => {
            dev = !dev;
            inputBox.placeholder = `Package name, adding with ${nodeStatus.getPMCommand()} to ${dev ? 'development' : 'production'} dependencies`;
            if (dev) {
                inputBox.buttons = [
                    {
                        tooltip: "Development",
                        iconPath: new vscode.ThemeIcon(`devspace-check`)
                    }
                ];
            }
            else {
                inputBox.buttons = [
                    {
                        tooltip: "Production",
                        iconPath: new vscode.ThemeIcon(`devspace-cross`)
                    }
                ];
            }
        });
        inputBox.onDidAccept(() => {
            const node = inputBox.value;
            inputBox.hide();
            const terminal = vscode.window.createTerminal({ name: `Devspace Terminal` });
            terminal.show();
            terminal.sendText(getTerminalCommand("add", node, dev), true);
            vscode.window.onDidEndTerminalShellExecution(terminalE => {
                if (terminalE.terminal.name === `Devspace Terminal`) {
                    if (terminalE.exitCode?.toString() === '0') {
                        vscode.window.showInformationMessage(`Added ${node}`);
                        nodeViewProvider.refresh();
                    }
                    else {
                        vscode.window.showErrorMessage(`Failed to add ${node}`);
                    }
                    terminal.dispose();
                }
            });
        });
        inputBox.onDidHide(() => { inputBox.dispose(); });
        inputBox.show();
    });
    /**
     * Update Node Item
     * Param: depnode: Dependency
     * Function: Get Terminal Command
     */
    vscode.commands.registerCommand('devspace.updateNodeItem', (depnode) => {
        const terminal = vscode.window.createTerminal({ name: `Devspace Terminal` });
        terminal.show();
        terminal.sendText(getTerminalCommand("update", depnode.name), true);
        vscode.window.onDidEndTerminalShellExecution(terminalE => {
            if (terminalE.terminal.name === `Devspace Terminal`) {
                if (terminalE.exitCode?.toString() === '0') {
                    vscode.window.showInformationMessage(`Updated ${depnode.name}`);
                    nodeViewProvider.refresh();
                }
                else {
                    vscode.window.showErrorMessage(`Failed to update ${depnode.name}`);
                }
                terminal.dispose();
            }
        });
    });
    /**
     * Remove Node Item
     * Param: depnode: Dependency
     * Function: Get Terminal Command
     */
    vscode.commands.registerCommand('devspace.removeNodeItem', (depnode) => {
        const terminal = vscode.window.createTerminal({ name: `Devspace Terminal` });
        terminal.show();
        terminal.sendText(getTerminalCommand("remove", depnode.name), true);
        vscode.window.onDidEndTerminalShellExecution(terminalE => {
            if (terminalE.terminal.name === `Devspace Terminal`) {
                if (terminalE.exitCode?.toString() === '0') {
                    vscode.window.showInformationMessage(`Removed ${depnode.name}`);
                    nodeViewProvider.refresh();
                }
                else {
                    vscode.window.showErrorMessage(`Failed to remove ${depnode.name}`);
                }
                terminal.dispose();
            }
        });
    });
    /**
     * Open Node Item
     * Param: depnode: Dependency
     * Command: Open
     */
    vscode.commands.registerCommand('devspace.openNodeItem', (depnode) => {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${depnode.name}`));
    });
    /* EVENTS */
    /**
     * On Did Change Active Text Editor
     * Param: editorE: vscode.TextEditor
     */
    vscode.window.onDidChangeActiveTextEditor(async (editorE) => {
        let filePath = editorE?.document.fileName;
        let areSame = false;
        let count = 9;
        let folderPath;
        let index;
        let folderName;
        let windows = false;
        if (filePath?.includes('\\')) {
            filePath = filePath?.replace('\\', '/');
            windows = true;
        }
        if (filePath) {
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
            if (!areSame) {
                folderPath = filePath?.slice(0, filePath.lastIndexOf('/'));
                index = folderPath?.lastIndexOf('/');
                if (index === -1 || !index) {
                    return;
                }
                folderName = folderPath?.slice(index + 1);
                while (!areSame && (index !== -1 && index) && folderName) {
                    if (nodeStatus.pathExists(path.join(`${folderPath}`, "package.json"))) {
                        areSame = true;
                    }
                    if (!areSame) {
                        folderPath = folderPath?.slice(0, folderPath.lastIndexOf('/'));
                        index = folderPath?.lastIndexOf('/');
                        if (index === -1 || !index) {
                            break;
                        }
                        folderName = folderPath?.slice(index + 1);
                    }
                }
            }
        }
        if (areSame) {
            if (windows) {
                folderPath = folderPath?.replace('/', '\\');
            }
            if (folderPath && nodeStatus.pathExists(path.join(`${folderPath}`, "package.json"))) {
                if (nodeHistory.includes(folderPath)) {
                    nodeHistory.splice(nodeHistory.indexOf(folderPath), 1);
                }
                nodeHistory.push(folderPath);
                if (nodeHistory.length > 10) {
                    nodeHistory.splice(0, 1);
                }
            }
            await vscode.workspace.getConfiguration('devspace').update('nodeRoot', folderPath, true);
            nodeViewProvider.update();
            nodeStatus.update();
            nodeViewProvider.refresh();
        }
    });
    /**
     * On Did Change Configuration
     * Param: configE: vscode.ConfigurationChangeEvent
     */
    vscode.workspace.onDidChangeConfiguration(async (configE) => {
        if (configE.affectsConfiguration('devspace')) {
            nodeViewProvider.update();
            nodeStatus.update();
            nodeViewProvider.refresh();
        }
    });
}
/* FUNCTIONS */
/**
 * Get Terminal Command
 * Param: action: string, node: string, dev?: boolean
 * Return: string
 * Configuration: Secured Root, Package Manager
 */
function getTerminalCommand(action, node, dev) {
    const securedRoot = vscode.workspace.getConfiguration('devspace').get('securedRoot');
    const packageManager = vscode.workspace.getConfiguration('devspace').get('packageManager');
    let command = "";
    if (packageManager === "bun") {
        command += `bun `;
        if (action === "add") {
            command += `add ${dev ? `--dev` : ""} ${node}`;
        }
        else if (action === "update") {
            command += `update ${node} --lastest`;
        }
        else if (action === "remove") {
            command += `remove ${node}`;
        }
    }
    else if (packageManager === "npm") {
        command += `${securedRoot ? 'sudo' : ''} npm `;
        if (action === "add") {
            command += `add ${dev ? `--save-dev` : ""} ${node}`;
        }
        else if (action === "update") {
            command += `install ${node}@latest`;
        }
        else if (action === "remove") {
            command += `remove ${node}`;
        }
    }
    else if (packageManager === "yarn") {
        command += `${securedRoot ? 'sudo' : ''} yarn `;
        if (action === "add") {
            command += `add ${dev ? `--dev` : ""} ${node}`;
        }
        else if (action === "update") {
            command += `upgrade ${node} --lastest`;
        }
        else if (action === "remove") {
            command += `remove ${node}`;
        }
    }
    return command;
}
//# sourceMappingURL=activateNodeView.js.map