import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { PackageViewProvider, Package } from './PackageViewProvider';
import { PackageStatus } from './PackageStatus';

export function activatePackageView(): void {
    /* VARIABLES */

    /* Package Root */ // Used only for initial setup
    const packageRoot = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    vscode.workspace.getConfiguration('devspace').update('packageRoot', packageRoot, true);

    /* Package View Provider */
    const packageViewProvider = new PackageViewProvider();
    vscode.window.registerTreeDataProvider('devspace.packageView', packageViewProvider);

    /* Package Status */
    const packageStatus = new PackageStatus(vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100));

    /* Package History */
    const packageHistory: string[] = [];

    /* COMMANDS */

    /**
     * Refresh Package View
     * Variables: Package View Provider
     */
    vscode.commands.registerCommand('devspace.refreshPackageView', () => {
        packageViewProvider.refresh()
    });

    /**
     * Open Package Folder
     * Configuration: Package Root
     * Functions: Get Package Type
     */
    vscode.commands.registerCommand('devspace.openPackageFolder', async () => {
        const packageRoot: string | undefined = vscode.workspace.getConfiguration('devspace').get('packageRoot');
        const packageManagerType = getPackageType(packageRoot);
        if (packageRoot === undefined || packageManagerType === "") { return; }
        const document = await vscode.workspace.openTextDocument(path.join(packageRoot, (packageManagerType === "node" ? 'package.json' : packageManagerType === "pip" ? 'pyproject.toml' : 'Cargo.toml')));
        vscode.window.showTextDocument(document);
        vscode.workspace.updateWorkspaceFolders(
            vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, 
            null,
            { uri: vscode.Uri.parse(packageRoot) }
        );
    });

    /**
     * Change Package Manager
     * Configuration: Package Root,Package Managers, Secured Root
     * Functions: Get Package Type
     */
    vscode.commands.registerCommand('devspace.changePackageManager', () => {
        const packageManagerPick = vscode.window.createQuickPick();
        packageManagerPick.title = 'Change Package Manager';
        packageManagerPick.placeholder = 'Choose a Package Manager';

        const packageRoot: string | undefined = vscode.workspace.getConfiguration('devspace').get('packageRoot');
        const packageManagerType = getPackageType(packageRoot);

        // packageManagerType === "node" || packageManagerType === ""
        packageManagerPick.items = [
            { label: 'npm' },
            { label: 'bun' },
            { label: 'yarn' },
            { label: 'sudo npm' },
            { label: 'sudo bun' },
            { label: 'sudo yarn' }
        ];
        if (packageManagerType === "pip") {
            packageManagerPick.items = [
                { label: 'uv' },
                { label: 'poetry' },
                { label: 'sudo uv' },
                { label: 'sudo poetry' }
            ];
        } else if (packageManagerType === "crate") {
            packageManagerPick.items = [
                { label: 'cargo' }
            ];
        }
        packageManagerPick.canSelectMany = false;

        packageManagerPick.onDidAccept(async () => {
            let packageManagers: string[] | undefined = vscode.workspace.getConfiguration('devspace').get('packageManagers');
            if (!packageManagers || packageManagers.length === 0) { return; }
            if (packageManagerType === "crate") { packageManagerPick.hide(); return; }
            let sudo = false;
            let packageManager = "";
            if (packageManagerPick.selectedItems[0].label.includes('sudo')) {
                sudo = true;
                packageManager = packageManagerPick.selectedItems[0].label.split(' ')[1];
            } else {
                packageManager = packageManagerPick.selectedItems[0].label;
            }

            if (packageManagerType === "node" || packageManagerType === "") {
                packageManagers[0] = packageManager;
            } else if (packageManagerType === "pip") {
                packageManagers[1] = packageManager;
            }
            await vscode.workspace.getConfiguration('devspace').update('securedRoot', sudo, true);
            await vscode.workspace.getConfiguration('devspace').update('packageManagers', packageManagers, true);
            packageManagerPick.hide();
        });
        packageManagerPick.onDidHide(() => packageManagerPick.dispose());
        packageManagerPick.show();
    });

    /**
     * Show Package History
     * Keybinding: Ctrl+Alt+H
     * Variable: Package History, Package View Provider, Package Status
     * Command: Open Package Folder
     * Function: Get Package Type
     */
    vscode.commands.registerCommand('devspace.showPackageHistory', () => {
        const packageHistoryPick = vscode.window.createQuickPick();
        packageHistoryPick.title = 'Package History';
        packageHistoryPick.placeholder = (packageHistory.length === 0) ? 'No package history' : 'Package history';

        let packageSelect: vscode.QuickPickItem[] = [];
        packageHistory.map((projectRoot: string) => {
            packageSelect.push({ label: projectRoot, description: getPackageType(projectRoot) });
        })

        packageHistoryPick.items = packageSelect;

        packageHistoryPick.onDidAccept(async () => {
            const projectRoot: string = packageHistoryPick.selectedItems[0].label;
            await vscode.workspace.getConfiguration('devspace').update('packageRoot', projectRoot, true);
            packageViewProvider.update();
            packageStatus.update();
            packageViewProvider.refresh();
            await vscode.commands.executeCommand('devspace.openPackageFolder');
            packageHistoryPick.hide();
        });
        packageHistoryPick.onDidHide(() => { packageHistoryPick.dispose(); })
        packageHistoryPick.show();
    });

    /**
     * Add Package Item Prompt
     * Configuration: Package Root, Package Managers
     * Command: Add Package Item
     * Function: Get Package Type
     */
    vscode.commands.registerCommand('devspace.addPackageItemPrompt', () => {
        const packageRoot: string | undefined = vscode.workspace.getConfiguration('devspace').get('packageRoot');
        const packageManagerType = getPackageType(packageRoot);
        if (packageManagerType !== "") {
            vscode.commands.executeCommand('devspace.addPackageItem', packageManagerType, "");
            return;
        }
        
        const packageManagerTypePick = vscode.window.createQuickPick();
        packageManagerTypePick.title = 'Package Manager Type';
        packageManagerTypePick.placeholder = `Select a package manager type`;
        packageManagerTypePick.items = [
            { label: 'Node' },
            { label: 'Pip' },
            { label: 'Crate' }
        ];
        packageManagerTypePick.canSelectMany = false;
        packageManagerTypePick.onDidAccept(async () => {
            const packageManagers: string[] | undefined = vscode.workspace.getConfiguration('devspace').get('packageManagers');
            if (!packageManagers || packageManagers.length === 0) { return; }
            const packageManagerType = packageManagerTypePick.selectedItems[0].label.toLowerCase();
            let packageManager = "";
            if (packageManagerType === "node") { packageManager = packageManagers[0]; }
            else if (packageManagerType === "pip") { packageManager = packageManagers[1]; }
            else if (packageManagerType === "crate") { packageManager = packageManagers[2]; }
            vscode.commands.executeCommand('devspace.addPackageItem', packageManagerType, packageManager);
            packageManagerTypePick.hide();
        });
        packageManagerTypePick.onDidHide(() => { packageManagerTypePick.dispose(); })
        packageManagerTypePick.show();
    });

    /**
     * Add Package Item
     * Param: packageManagerType: string, packageManager: string
     * Function: Get Terminal Command
     */
    vscode.commands.registerCommand('devspace.addPackageItem', (packageManagerType: string, packageManager: string) => {
        const packageRoot: string | undefined = vscode.workspace.getConfiguration('devspace').get('packageRoot');


        const inputBox = vscode.window.createInputBox();
        let dev = false;

        inputBox.placeholder = `${packageManagerType.charAt(0).toUpperCase() + packageManagerType.slice(1)} package name, adding with ${packageManager ? packageManager : packageStatus.getPMCommand(packageRoot)} to production dependencies`;
        inputBox.buttons = [
            {
                tooltip: "Production",
                iconPath: new vscode.ThemeIcon(`devspace-gear`)
            }
        ];

        inputBox.onDidTriggerButton(button => {
            dev = !dev;
            inputBox.placeholder = `${packageManagerType.charAt(0).toUpperCase() + packageManagerType.slice(1)} package name, adding with ${packageManager ? packageManager : packageStatus.getPMCommand(packageRoot)} to ${dev ? 'development' : 'production'} dependencies`;
            if (dev) {
                inputBox.buttons = [
                    {
                        tooltip: "Development",
                        iconPath: new vscode.ThemeIcon(`devspace-code`)
                    }
                ];
            } else {
                inputBox.buttons = [
                    {
                        tooltip: "Production",
                        iconPath: new vscode.ThemeIcon(`devspace-gear`)
                    }
                ];
            }
        });

        inputBox.onDidAccept(() => {
            const pkg = inputBox.value;
            inputBox.hide();
            const terminal = vscode.window.createTerminal({ name: `Devspace Terminal` });
            terminal.show();
            terminal.sendText(getTerminalCommand("add", pkg, dev, packageManagerType), true);
            vscode.window.onDidEndTerminalShellExecution(terminalE => {
                if (terminalE.terminal.name === `Devspace Terminal`) {
                    if (terminalE.exitCode?.toString() === '0') {
                        vscode.window.showInformationMessage(`Added ${pkg}`);
                        packageViewProvider.refresh();
                    } else {
                        vscode.window.showErrorMessage(`Failed to add ${pkg}`);
                    }
                    terminal.dispose();
                }
            });
        });
        inputBox.onDidHide(() => { inputBox.dispose(); })
        inputBox.show();
    });

    /** 
     * Update Package Item
     * Param: pkg: Package
     * Function: Get Terminal Command
     */
    vscode.commands.registerCommand('devspace.updatePackageItem', (pkg: Package) => {
        const terminal = vscode.window.createTerminal({ name: `Devspace Terminal` });
        terminal.show();
        terminal.sendText(getTerminalCommand("update", pkg.name, false, pkg.managerType), true);
        vscode.window.onDidEndTerminalShellExecution(terminalE => {
            if (terminalE.terminal.name === `Devspace Terminal`) {
                if (terminalE.exitCode?.toString() === '0') {
                    vscode.window.showInformationMessage(`Updated ${pkg.name}`);
                    packageViewProvider.refresh();
                } else {
                    vscode.window.showErrorMessage(`Failed to update ${pkg.name}`);
                }
                terminal.dispose();
            }
        });
    });

    /** 
     * Remove Package Item
     * Param: pkg: Package
     * Function: Get Terminal Command
     */
    vscode.commands.registerCommand('devspace.removePackageItem', (pkg: Package) => {
        const terminal = vscode.window.createTerminal({ name: `Devspace Terminal` });
        terminal.show();
        terminal.sendText(getTerminalCommand("remove", pkg.name, false, pkg.managerType), true);
        vscode.window.onDidEndTerminalShellExecution(terminalE => {
            if (terminalE.terminal.name === `Devspace Terminal`) {
                if (terminalE.exitCode?.toString() === '0') {
                    vscode.window.showInformationMessage(`Removed ${pkg.name}`);
                    packageViewProvider.refresh();
                } else {
                    vscode.window.showErrorMessage(`Failed to remove ${pkg.name}`);
                }
                terminal.dispose();
            }
        });
    });

    /** 
     * Open Package Item
     * Param: pkg: Package
     * Command: Open
     */
    vscode.commands.registerCommand('devspace.openPackageItem', (pkg: Package) => {
        if (pkg.managerType === "node") {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${pkg.name}`));
        } else if (pkg.managerType === "pip") {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://pypi.org/project/${pkg.name}`));
        } else if (pkg.managerType === "crate") {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://crates.io/crates/${pkg.name}`));
        }
    });

    /* EVENTS */

    /**
     * On Did Change Active Text Editor
     * Param: editorE: vscode.TextEditor
     */
    vscode.window.onDidChangeActiveTextEditor(async editorE => {
        let filePath = editorE?.document.fileName;
        let areSame = false;
        let count = 9;
        let folderPath;
        let index;
        let folderName: any;
        let windows = false;

        if (filePath?.includes('\\')) {
            filePath = filePath?.replace('\\', '/');
            windows = true;
        }
        if (filePath) {
            folderPath = filePath?.slice(0, filePath.lastIndexOf('/'));
            index = folderPath?.lastIndexOf('/');
            if (index === -1 || !index) { return; }
            folderName = folderPath?.slice(index + 1);
            
            while (!areSame && count > 0 && (index !== -1 && index) && folderName) {
                vscode.workspace.workspaceFolders?.forEach(workspaceFolder => {
                    if (workspaceFolder.name === `${folderName}`) { areSame = true; }
                });
                if (!areSame) {
                    folderPath = folderPath?.slice(0, folderPath.lastIndexOf('/'));
                    index = folderPath?.lastIndexOf('/');
                    if (index === -1 || !index) { break; }
                    folderName = folderPath?.slice(index + 1);
                    count--;
                }
            }

            if (!areSame) {
                folderPath = filePath?.slice(0, filePath.lastIndexOf('/'));
                index = folderPath?.lastIndexOf('/');
                if (index === -1 || !index) { return; }
                folderName = folderPath?.slice(index + 1);

                while (!areSame && (index !== -1 && index) && folderName) {
                    if (getPackageType(folderPath) !== "") { areSame = true; }
                    if (!areSame) {
                        folderPath = folderPath?.slice(0, folderPath.lastIndexOf('/'));
                        index = folderPath?.lastIndexOf('/');
                        if (index === -1 || !index) { break; }
                        folderName = folderPath?.slice(index + 1);
                    }
                }
            }
        }

        if (areSame) {
            if (windows) { folderPath = folderPath?.replace('/', '\\'); }

            if (folderPath) {
                if (packageHistory.includes(folderPath)) { packageHistory.splice(packageHistory.indexOf(folderPath), 1); }
                packageHistory.push(folderPath);
                if (packageHistory.length > 10) { packageHistory.splice(0, 1); }
            }

            await vscode.workspace.getConfiguration('devspace').update('packageRoot', folderPath, true);
            packageViewProvider.update();
            packageViewProvider.refresh();
            packageStatus.update();
        }
    });

    /**
     * On Did Change Configuration
     * Param: configE: vscode.ConfigurationChangeEvent
     */
    vscode.workspace.onDidChangeConfiguration(async configE => {
        if (configE.affectsConfiguration('devspace.packageRoot') || configE.affectsConfiguration('devspace.packageManagers') || configE.affectsConfiguration('devspace.securedRoot') || configE.affectsConfiguration('devspace.showNewVersions') || configE.affectsConfiguration('devspace.showSections')) {
            await fixPackageManagers();
            packageViewProvider.update();
            packageViewProvider.refresh();
            packageStatus.update();
        }
    });
}

/* FUNCTIONS */

/**
 * Get Terminal Command
 * Param: action: string, pkg: string, dev?: boolean, packageManagerType: string
 * Return: string
 * Configuration: Secured Root, Package Manager
 */
function getTerminalCommand(action: string, pkg: string, dev?: boolean, packageManagerType: string = "node"): string {
    const securedRoot: boolean | undefined = vscode.workspace.getConfiguration('devspace').get('securedRoot');
    const packageManagers: string[] | undefined = vscode.workspace.getConfiguration('devspace').get('packageManagers');
    if (!packageManagers || packageManagers.length === 0) { return ""; }
    let command = "";
    if (packageManagerType === "node") {
        const packageManager: string = packageManagers[0];
        if (packageManager === "npm") {
            command += `${securedRoot ? 'sudo' : ''} npm `;
            if (action === "add") { command += `add ${dev ? `--save-dev` : ""} ${pkg}`; }
            else if (action === "update") { command += `update ${pkg}`; }
            else if (action === "upgrade") { command += `install ${pkg}@latest`; }
            else if (action === "remove") { command += `remove ${pkg}`; }
        } else if (packageManager === "bun") {
            command += `${securedRoot ? 'sudo' : ''} bun `;
            if (action === "add") { command += `add ${dev ? `--dev` : ""} ${pkg}`; }
            else if (action === "update") { command += `update ${pkg}`; }
            else if (action === "upgrade") { command += `add ${pkg}@latest`; }
            else if (action === "remove") { command += `remove ${pkg}`; }
        } else if (packageManager === "yarn") {
            command += `${securedRoot ? 'sudo' : ''} yarn `;
            if (action === "add") { command += `add ${dev ? `--dev` : ""} ${pkg}`; }
            else if (action === "update") { command += `upgrade ${pkg}`; }
            else if (action === "upgrade") { command += `upgrade ${pkg} --latest`; }
            else if (action === "remove") { command += `remove ${pkg}`; }
        }
    } else if (packageManagerType === "pip") {
        const packageManager: string = packageManagers[1];
        if (packageManager === "uv") {
            command += `${securedRoot ? 'sudo' : ''} uv `;
            if (action === "add") { command += `add ${pkg} ${dev ? `--dev` : ""}`; }
            else if (action === "update") { command += `sync ${pkg}`; }
            else if (action === "upgrade") { command += `sync --upgrade-package ${pkg}`; }
            else if (action === "remove") { command += `remove ${pkg}`; }
        } else if (packageManager === "poetry") {
            command += `${securedRoot ? 'sudo' : ''} poetry `;
            if (action === "add") { command += `install ${pkg} ${dev ? `--group dev` : ""}`; }
            else if (action === "update") { command += `update --sync ${pkg}`; }
            else if (action === "upgrade") { command += `add ${pkg}@latest`; }
            else if (action === "remove") { command += `remove ${pkg}`; }
        }
    } else if (packageManagerType === "crate") {
        command += `cargo `;
        if (action === "add") { command += `add ${pkg} ${dev ? `--dev` : ""}`; }
        else if (action === "update") { command += `update -p ${pkg}`; }
        else if (action === "remove") { command += `remove ${pkg}`; }
        return command;
    }
    return command;
}

/**
 * Get Package Type
 * Param: packageRoot?: string
 * Return: string
 */
function getPackageType(packageRoot?: string): string {
    if (packageRoot) {
        if (fs.existsSync(path.join(`${packageRoot}`, "package.json"))) { return "node"; }
        if (fs.existsSync(path.join(`${packageRoot}`, "pyproject.toml"))) { return "pip"; }
        if (fs.existsSync(path.join(`${packageRoot}`, "Cargo.toml"))) { return "crate"; }
    }
    return "";
}

async function fixPackageManagers() {
    const packageManagers: string[] | undefined = vscode.workspace.getConfiguration('devspace').get('packageManagers');
    if (!packageManagers || packageManagers.length < 3) {
        await vscode.workspace.getConfiguration('devspace').update('packageManagers', ['npm', 'uv', 'cargo'], true);
        return;
    }
    if (!"npmbunyarn".includes(packageManagers[0])) {
        await vscode.workspace.getConfiguration('devspace').update('packageManagers', ['npm', packageManagers[1], packageManagers[2]], true);
    }
    if (!"uvpoetry".includes(packageManagers[1])) {
        await vscode.workspace.getConfiguration('devspace').update('packageManagers', [packageManagers[0], 'uv', packageManagers[2]], true);
    }
    if (packageManagers[2] !== "cargo") {
        await vscode.workspace.getConfiguration('devspace').update('packageManagers', [packageManagers[0], packageManagers[1], 'cargo'], true);
    }
}