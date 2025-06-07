"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateProjectBox = activateProjectBox;
const vscode = require("vscode");
const ProjectBoxStatus_1 = require("./ProjectBoxStatus");
function activateProjectBox() {
    /* VARIABLES */
    /* Project Box Status */
    const projectBoxStatus = new ProjectBoxStatus_1.ProjectBoxStatus(vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100));
    /* COMMANDS */
    /**
     * Show Project Box
     * Configuration: Projects
     * Command: Workbench.Explorer.FileView.Focus, Add Folders to Box, Remove Folders from Workspace, Show Project Box
     * Function: Get Folder Name
     */
    vscode.commands.registerCommand('devspace.showProjectBox', () => {
        const projectBoxPick = vscode.window.createQuickPick();
        projectBoxPick.title = 'Project Box';
        projectBoxPick.placeholder = 'Your projects';
        const projects = vscode.workspace.getConfiguration('devspace').get('projects');
        const workspaceFolders = vscode.workspace.workspaceFolders;
        let projectSelect = [];
        projects?.map((project) => {
            let buttonUI = [{ tooltip: "Remove Folder from Box", iconPath: new vscode.ThemeIcon(`devspace-folderMinus`) }, { tooltip: "Add Folder to Workspace", iconPath: new vscode.ThemeIcon(`devspace-plus`) }];
            if (workspaceFolders?.find(folder => getFolderName(folder.uri.fsPath) === project.name)) {
                buttonUI = [{ tooltip: "Remove Folder from Box", iconPath: new vscode.ThemeIcon(`devspace-folderMinus`) }];
            }
            projectSelect.push({ label: project.name, description: project.path, buttons: buttonUI });
        });
        if (projectSelect.length === 0) {
            projectBoxPick.placeholder = 'No projects to show';
        }
        projectBoxPick.buttons = [
            {
                tooltip: "Show Workspace",
                iconPath: new vscode.ThemeIcon(`devspace-cabinet`)
            },
            {
                tooltip: "Add Folders to Box",
                iconPath: new vscode.ThemeIcon(`devspace-folderPlus`)
            },
            {
                tooltip: "Remove Folders from Workspace",
                iconPath: new vscode.ThemeIcon(`devspace-minus`)
            }
        ];
        projectBoxPick.items = projectSelect;
        projectBoxPick.onDidTriggerButton(button => {
            if (button.tooltip === "Show Workspace") {
                vscode.commands.executeCommand('workbench.explorer.fileView.focus');
            }
            else if (button.tooltip === "Add Folders to Box") {
                vscode.commands.executeCommand('devspace.addFoldersBox');
            }
            else if (button.tooltip === "Remove Folders from Workspace") {
                vscode.commands.executeCommand('devspace.removeFoldersWorkspace');
            }
            projectBoxPick.hide();
        });
        projectBoxPick.onDidTriggerItemButton(async (button) => {
            if (button.button.tooltip === "Remove Folder from Box") {
                if (!projects) {
                    return;
                }
                let index = projects.findIndex((project) => project.name === button.item.label);
                projects.splice(index, 1);
                await vscode.workspace.getConfiguration('devspace').update('projects', projects, true);
                projectBoxStatus.update();
            }
            else if (button.button.tooltip === "Add Folder to Workspace") {
                if (button.item.description === undefined) {
                    return;
                }
                vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.parse(button.item.description) });
            }
            projectBoxPick.hide();
            vscode.commands.executeCommand('devspace.showProjectBox');
        });
        projectBoxPick.onDidAccept(() => projectBoxPick.hide());
        projectBoxPick.onDidHide(() => projectBoxPick.dispose());
        projectBoxPick.show();
    });
    /**
     * Add Folders to Box
     * Configuration: Projects
     * Command: Show Project Box, Add Folders to Box
     * Function: Get Folder Name
     */
    vscode.commands.registerCommand('devspace.addFoldersBox', () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const folderPick = vscode.window.createQuickPick();
        folderPick.title = 'Add Folders to Box';
        folderPick.placeholder = 'Select folder(s)';
        const projects = vscode.workspace.getConfiguration('devspace').get('projects');
        let folderSelect = [];
        if (workspaceFolders) {
            workspaceFolders.map((folder) => {
                if (!projects?.find((project) => project.name === getFolderName(folder.uri.fsPath))) {
                    folderSelect.push({ label: getFolderName(folder.uri.fsPath), description: folder.uri.fsPath });
                }
            });
        }
        if (folderSelect.length === 0) {
            folderPick.placeholder = 'No folders to add to Box';
        }
        folderPick.items = folderSelect;
        folderPick.canSelectMany = true;
        folderPick.buttons = [
            {
                tooltip: "Back to Project Box",
                iconPath: new vscode.ThemeIcon(`devspace-box`)
            }
        ];
        folderPick.onDidTriggerButton(button => {
            if (button.tooltip === "Back to Project Box") {
                folderPick.hide();
                vscode.commands.executeCommand('devspace.showProjectBox');
            }
        });
        folderPick.onDidChangeSelection(async (items) => {
            if (!projects) {
                return;
            }
            items.map((item) => {
                if (!item.description) {
                    return;
                }
                if (!projects.find((project) => project.name === item.label)) {
                    projects.push({ name: item.label, path: item.description });
                }
            });
            await vscode.workspace.getConfiguration('devspace').update('projects', projects, true);
            projectBoxStatus.update();
            folderPick.hide();
            vscode.commands.executeCommand('devspace.addFoldersBox');
        });
        folderPick.onDidAccept(() => folderPick.hide());
        folderPick.onDidHide(() => folderPick.dispose());
        folderPick.show();
    });
    /**
     * Remove Folders from Box
     * Configuration: Projects
     * Command: Show Project Box, Remove Folders from Box
     */
    vscode.commands.registerCommand('devspace.removeFoldersBox', () => {
        const folderPick = vscode.window.createQuickPick();
        folderPick.title = 'Remove Folders from Box';
        folderPick.placeholder = 'Select folder(s)';
        const projects = vscode.workspace.getConfiguration('devspace').get('projects');
        let folderSelect = [];
        projects?.map((project) => {
            folderSelect.push({ label: project.name, description: project.path });
        });
        if (folderSelect.length === 0) {
            folderPick.placeholder = 'No folders to remove from Box';
        }
        folderPick.items = folderSelect;
        folderPick.canSelectMany = true;
        folderPick.buttons = [
            {
                tooltip: "Back to Project Box",
                iconPath: new vscode.ThemeIcon(`devspace-box`)
            }
        ];
        folderPick.onDidTriggerButton(button => {
            if (button.tooltip === "Back to Project Box") {
                folderPick.hide();
                vscode.commands.executeCommand('devspace.showProjectBox');
            }
        });
        folderPick.onDidChangeSelection(async (items) => {
            if (!projects) {
                return;
            }
            items.map((item) => {
                if (projects.find((project) => project.name === item.label)) {
                    let index = projects.findIndex((project) => project.name === item.label);
                    projects.splice(index, 1);
                }
            });
            await vscode.workspace.getConfiguration('devspace').update('projects', projects, true);
            projectBoxStatus.update();
            folderPick.hide();
            vscode.commands.executeCommand('devspace.removeFoldersBox');
        });
        folderPick.onDidAccept(() => folderPick.hide());
        folderPick.onDidHide(() => folderPick.dispose());
        folderPick.show();
    });
    /**
     * Add Folders to Workspace
     * Configuration: Projects
     * Command: Show Project Box, Add Folders to Workspace
     */
    vscode.commands.registerCommand('devspace.addFoldersWorkspace', () => {
        const folderPick = vscode.window.createQuickPick();
        folderPick.title = 'Add Folder to Workspace';
        folderPick.placeholder = 'Select folder(s)';
        const projects = vscode.workspace.getConfiguration('devspace').get('projects');
        let folderSelect = [];
        projects?.map((project) => {
            folderSelect.push({ label: project.name, description: project.path });
        });
        if (folderSelect.length === 0) {
            folderPick.placeholder = 'No folders to add to Workspace';
        }
        folderPick.items = folderSelect;
        folderPick.canSelectMany = true;
        folderPick.buttons = [
            {
                tooltip: "Back to Project Box",
                iconPath: new vscode.ThemeIcon(`devspace-box`)
            }
        ];
        folderPick.onDidTriggerButton(button => {
            if (button.tooltip === "Back to Project Box") {
                folderPick.hide();
                vscode.commands.executeCommand('devspace.showProjectBox');
            }
        });
        folderPick.onDidChangeSelection(items => {
            items.map((item) => {
                if (item.description === undefined) {
                    return;
                }
                vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.parse(item.description) });
            });
            folderPick.hide();
            vscode.commands.executeCommand('devspace.addFoldersWorkspace');
        });
        folderPick.onDidAccept(() => folderPick.hide());
        folderPick.onDidHide(() => folderPick.dispose());
        folderPick.show();
    });
    /**
     * Remove Folders from Workspace
     * Command: Show Project Box, Remove Folders from Workspace
     * Function: Get Folder Name
     */
    vscode.commands.registerCommand('devspace.removeFoldersWorkspace', () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const folderPick = vscode.window.createQuickPick();
        folderPick.title = 'Remove Folder from Workspace';
        folderPick.placeholder = 'Select folder(s)';
        let folderSelect = [];
        if (workspaceFolders) {
            workspaceFolders.map((folder) => {
                folderSelect.push({ label: getFolderName(folder.uri.fsPath), description: folder.uri.fsPath });
            });
        }
        if (folderSelect.length === 0) {
            folderPick.placeholder = 'No folders to remove from Workspace';
        }
        folderPick.items = folderSelect;
        folderPick.canSelectMany = true;
        folderPick.buttons = [
            {
                tooltip: "Back to Project Box",
                iconPath: new vscode.ThemeIcon(`devspace-box`)
            }
        ];
        folderPick.onDidTriggerButton(async (button) => {
            if (button.tooltip === "Back to Project Box") {
                folderPick.hide();
                vscode.commands.executeCommand('devspace.showProjectBox');
            }
        });
        folderPick.onDidChangeSelection(async (items) => {
            items.map((item) => {
                if (item.description === undefined) {
                    return;
                }
                const folderToRemove = workspaceFolders?.find(folder => getFolderName(folder.uri.fsPath) === item.label);
                if (folderToRemove && workspaceFolders) {
                    vscode.workspace.updateWorkspaceFolders(workspaceFolders?.indexOf(folderToRemove), 1);
                }
            });
            folderPick.hide();
            vscode.commands.executeCommand('devspace.removeFoldersWorkspace');
        });
        folderPick.onDidAccept(() => folderPick.hide());
        folderPick.onDidHide(() => folderPick.dispose());
        folderPick.show();
    });
    /* EVENTS */
    /**
     * ON Did Change Configuration
     * Param: configE: vscode.ConfigurationChangeEvent
     */
    vscode.workspace.onDidChangeConfiguration(async (configE) => {
        if (configE.affectsConfiguration('devspace.projects')) {
            projectBoxStatus.update();
        }
    });
}
/* FUNCTIONS */
/**
 * Get Folder Name
 * Param: path: string
 * Return: string
 */
function getFolderName(path) {
    let folderName;
    if (path.includes('/')) {
        folderName = path.split('/').pop();
    }
    else if (path.includes('\\')) {
        folderName = path.split('\\').pop();
    }
    return `${folderName}`;
}
//# sourceMappingURL=activateProjectBox.js.map