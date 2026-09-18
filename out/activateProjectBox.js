"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateProjectBox = activateProjectBox;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const ProjectBoxStatus_1 = require("./ProjectBoxStatus");
function activateProjectBox() {
    /* VARIABLES */
    /* Project Box Status */
    const projectBoxStatus = new ProjectBoxStatus_1.ProjectBoxStatus(vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100));
    /* COMMANDS */
    /**
     * Show Project Box
     * Keybinding: Ctrl+Alt+B
     * Configuration: Projects, Categorize Projects, Project Categories
     * Variable: Project Box Status
     * Command: Show Project Box, Add Folder to Box with URI, Add Folders to Box, Remove Folders from Workspace, Show Categories
     * Function: Fix Project Categories, Get Folder Name
     */
    vscode.commands.registerCommand('devspace.showProjectBox', () => {
        fixProjectCategories();
        const projectBoxPick = vscode.window.createQuickPick();
        projectBoxPick.title = 'Project Box';
        projectBoxPick.placeholder = 'Your projects';
        const projects = vscode.workspace.getConfiguration('devspace').get('projects');
        const workspaceFolders = vscode.workspace.workspaceFolders;
        let projectSelect = [];
        const buttonUIp = [
            {
                tooltip: "Remove Folder from Box",
                iconPath: new vscode.ThemeIcon(`devspace-project-remove`)
            },
            {
                tooltip: "Add Folder to Workspace",
                iconPath: new vscode.ThemeIcon(`devspace-folder-add`)
            },
            {
                tooltip: "Switch to Folder",
                iconPath: new vscode.ThemeIcon(`devspace-folder-switch`)
            }
        ];
        if (!vscode.workspace.getConfiguration('devspace').get('categorizeProjects')) {
            projects?.map((project) => {
                let buttonUI = [...buttonUIp];
                if (workspaceFolders?.find(folder => getFolderName(folder.uri.fsPath) === project.name)) {
                    buttonUI.pop();
                    buttonUI.pop();
                }
                projectSelect.push({ label: project.name, description: project.path, buttons: buttonUI });
            });
        }
        else {
            const categories = vscode.workspace.getConfiguration('devspace').get('projectCategories');
            if (categories) {
                categories.map((category) => {
                    projectSelect.push({ label: category, kind: vscode.QuickPickItemKind.Separator });
                    projects?.filter((project) => project.category === category).map((project) => {
                        let buttonUI = [...buttonUIp];
                        if (workspaceFolders?.find(folder => getFolderName(folder.uri.fsPath) === project.name)) {
                            buttonUI.pop();
                            buttonUI.pop();
                        }
                        buttonUI.push({
                            tooltip: "Change Category",
                            iconPath: new vscode.ThemeIcon(`devspace-category-switch`)
                        });
                        projectSelect.push({ label: project.name, description: project.path, buttons: buttonUI });
                    });
                });
            }
        }
        if (projectSelect.length === 0) {
            projectBoxPick.placeholder = 'No projects to show';
        }
        const button = [
            {
                tooltip: "Toggle categorization",
                iconPath: new vscode.ThemeIcon(`devspace-category-cross`)
            },
            {
                tooltip: "Add Folders to Box with URI",
                iconPath: new vscode.ThemeIcon(`devspace-project-install`)
            },
            {
                tooltip: "Add Folders to Box",
                iconPath: new vscode.ThemeIcon(`devspace-project-add`)
            },
            {
                tooltip: "Remove Folders from Workspace",
                iconPath: new vscode.ThemeIcon(`devspace-folder-remove`)
            },
            {
                tooltip: "Show Categories",
                iconPath: new vscode.ThemeIcon(`devspace-category-container`)
            },
            {
                tooltip: "Show Workspace",
                iconPath: new vscode.ThemeIcon(`devspace-folder-container`)
            }
        ];
        if (!vscode.workspace.getConfiguration('devspace').get('categorizeProjects')) {
            projectBoxPick.buttons = button;
        }
        else {
            button[0] = {
                tooltip: "Toggle categorization",
                iconPath: new vscode.ThemeIcon(`devspace-category-check`)
            };
            projectBoxPick.buttons = button;
        }
        projectBoxPick.items = projectSelect;
        projectBoxPick.onDidTriggerButton(async (button) => {
            if (button.tooltip === "Toggle categorization") {
                const currentSetting = vscode.workspace.getConfiguration('devspace').get('categorizeProjects');
                await vscode.workspace.getConfiguration('devspace').update('categorizeProjects', !currentSetting, true);
                projectBoxStatus.update();
                await vscode.commands.executeCommand('devspace.showProjectBox');
            }
            else if (button.tooltip === "Add Folders to Box with URI") {
                vscode.commands.executeCommand('devspace.addFoldersBoxUri');
            }
            else if (button.tooltip === "Add Folders to Box") {
                vscode.commands.executeCommand('devspace.addFoldersBox');
            }
            else if (button.tooltip === "Remove Folders from Workspace") {
                vscode.commands.executeCommand('devspace.removeFoldersWorkspace');
            }
            else if (button.tooltip === "Show Categories") {
                vscode.commands.executeCommand('devspace.showCategories');
            }
            else if (button.tooltip === "Show Workspace") {
                vscode.commands.executeCommand('workbench.explorer.fileView.focus');
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
                await vscode.commands.executeCommand('devspace.showProjectBox');
            }
            else if (button.button.tooltip === "Add Folder to Workspace") {
                if (button.item.description === undefined) {
                    return;
                }
                vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.parse(button.item.description) });
            }
            else if (button.button.tooltip === "Switch to Folder") {
                if (!vscode.workspace.workspaceFolders) {
                    return;
                }
                if (button.item.description === undefined) {
                    return;
                }
                vscode.workspace.updateWorkspaceFolders(0, vscode.workspace.workspaceFolders.length, { uri: vscode.Uri.parse(button.item.description) });
                vscode.commands.executeCommand('workbench.action.closeAllEditors');
            }
            else if (button.button.tooltip === "Change Category") {
                const categoryPick = vscode.window.createQuickPick();
                categoryPick.title = `Change Category for ${button.item.label}`;
                categoryPick.placeholder = 'Select category';
                const categories = vscode.workspace.getConfiguration('devspace').get('projectCategories');
                let categorySelect = [];
                categories?.map(category => (categorySelect.push({ label: category })));
                categoryPick.items = categorySelect;
                categoryPick.onDidChangeSelection(async (items) => {
                    if (items.length === 0) {
                        return;
                    }
                    const selectedCategory = items[0].label;
                    const projects = vscode.workspace.getConfiguration('devspace').get('projects');
                    if (!projects) {
                        return;
                    }
                    let project = projects.find((project) => project.name === button.item.label);
                    if (project) {
                        project.category = selectedCategory;
                        await vscode.workspace.getConfiguration('devspace').update('projects', projects, true);
                        projectBoxStatus.update();
                    }
                    categoryPick.hide();
                    await vscode.commands.executeCommand('devspace.showProjectBox');
                });
                categoryPick.onDidHide(() => categoryPick.dispose());
                categoryPick.show();
            }
        });
        projectBoxPick.onDidAccept(() => projectBoxPick.hide());
        projectBoxPick.onDidHide(() => projectBoxPick.dispose());
        projectBoxPick.show();
    });
    /**
     * Add Folders to Box with URI
     * Configuration: Projects
     * Variable: Project Box Status
     * Command: Show Project Box
     * Function: Get Folder Name
     */
    vscode.commands.registerCommand('devspace.addFoldersBoxUri', () => {
        const inputBox = vscode.window.createInputBox();
        inputBox.title = 'Add Folders to Box';
        inputBox.placeholder = 'Enter folder path (absolute or relative to workspace)';
        let resolvedUri;
        inputBox.buttons = [
            {
                tooltip: "Back to Project Box",
                iconPath: new vscode.ThemeIcon(`devspace-project-container`)
            }
        ];
        inputBox.onDidTriggerButton(button => {
            if (button.tooltip === "Back to Project Box") {
                vscode.commands.executeCommand('devspace.showProjectBox');
            }
            inputBox.hide();
        });
        inputBox.onDidChangeValue(value => {
            if (path.isAbsolute(value) && fs.existsSync(value)) {
                resolvedUri = vscode.Uri.file(value);
                inputBox.validationMessage = undefined;
                return;
            }
            if (value) {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders) {
                    for (const folder of workspaceFolders) {
                        const absPath = path.resolve(folder.uri.fsPath, value);
                        if (fs.existsSync(absPath)) {
                            resolvedUri = vscode.Uri.file(absPath);
                            inputBox.validationMessage = undefined;
                            return;
                        }
                    }
                }
            }
            resolvedUri = undefined;
            inputBox.validationMessage = 'Invalid folder path';
        });
        inputBox.onDidAccept(async () => {
            const projects = vscode.workspace.getConfiguration('devspace').get('projects');
            if (!projects || !resolvedUri || projects.find((project) => project.name === getFolderName(resolvedUri?.fsPath ?? ""))) {
                return;
            }
            projects.push({ name: getFolderName(resolvedUri.fsPath), path: resolvedUri.fsPath, category: 'Uncategorized' });
            await vscode.workspace.getConfiguration('devspace').update('projects', projects, true);
            projectBoxStatus.update();
            inputBox.hide();
            await vscode.commands.executeCommand('devspace.showProjectBox');
        });
        inputBox.onDidHide(() => inputBox.dispose());
        inputBox.show();
    });
    /**
     * Add Folders to Box
     * Configuration: Projects
     * Variable: Project Box Status
     * Command: Show Project Box, Add Folders to Box
     * Function: Get Folder Name
     */
    vscode.commands.registerCommand('devspace.addFoldersBox', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showInformationMessage('No folders to add to Box');
            await vscode.commands.executeCommand('devspace.showProjectBox');
            return;
        }
        const folderPick = vscode.window.createQuickPick();
        folderPick.title = 'Add Folders to Box';
        folderPick.placeholder = 'Select folder(s)';
        const projects = vscode.workspace.getConfiguration('devspace').get('projects');
        let folderSelect = [];
        workspaceFolders.map(folder => {
            if (!projects?.find((project) => project.name === getFolderName(folder.uri.fsPath))) {
                folderSelect.push({ label: getFolderName(folder.uri.fsPath), description: folder.uri.fsPath });
            }
        });
        if (folderSelect.length === 0) {
            vscode.window.showInformationMessage('No folders to add to Box');
            await vscode.commands.executeCommand('devspace.showProjectBox');
            return;
        }
        folderPick.items = folderSelect;
        folderPick.canSelectMany = true;
        folderPick.buttons = [
            {
                tooltip: "Back to Project Box",
                iconPath: new vscode.ThemeIcon(`devspace-project-container`)
            }
        ];
        folderPick.onDidTriggerButton(async (button) => {
            if (button.tooltip === "Back to Project Box") {
                await vscode.commands.executeCommand('devspace.showProjectBox');
            }
            folderPick.hide();
        });
        folderPick.onDidChangeSelection(async (items) => {
            if (!projects) {
                return;
            }
            items.map(item => {
                if (!item.description || projects.find((project) => project.name === item.label)) {
                    return;
                }
                projects.push({ name: item.label, path: item.description, category: 'Uncategorized' });
            });
            await vscode.workspace.getConfiguration('devspace').update('projects', projects, true);
            projectBoxStatus.update();
            folderPick.hide();
            await vscode.commands.executeCommand('devspace.addFoldersBox');
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
    vscode.commands.registerCommand('devspace.removeFoldersWorkspace', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showInformationMessage('No folders to remove from Workspace');
            await vscode.commands.executeCommand('devspace.showProjectBox');
            return;
        }
        const folderPick = vscode.window.createQuickPick();
        folderPick.title = 'Remove Folder from Workspace';
        folderPick.placeholder = 'Select folder(s)';
        let folderSelect = [];
        workspaceFolders.map(folder => folderSelect.push({ label: getFolderName(folder.uri.fsPath), description: folder.uri.fsPath }));
        folderPick.items = folderSelect;
        folderPick.canSelectMany = true;
        folderPick.buttons = [
            {
                tooltip: "Back to Project Box",
                iconPath: new vscode.ThemeIcon(`devspace-project-container`)
            }
        ];
        folderPick.onDidTriggerButton(async (button) => {
            if (button.tooltip === "Back to Project Box") {
                await vscode.commands.executeCommand('devspace.showProjectBox');
            }
            folderPick.hide();
        });
        folderPick.onDidChangeSelection(async (items) => {
            items.map(item => {
                if (item.description === undefined) {
                    return;
                }
                const folderToRemove = workspaceFolders.find(folder => getFolderName(folder.uri.fsPath) === item.label);
                if (folderToRemove) {
                    vscode.workspace.updateWorkspaceFolders(workspaceFolders.indexOf(folderToRemove), 1);
                }
            });
            folderPick.hide();
            await vscode.commands.executeCommand('devspace.removeFoldersWorkspace');
        });
        folderPick.onDidAccept(() => folderPick.hide());
        folderPick.onDidHide(() => folderPick.dispose());
        folderPick.show();
    });
    /**
     * Show Project Categories
     * Configuration: Project Categories
     * Command: Show Categories, Show Project Box
     */
    vscode.commands.registerCommand('devspace.showCategories', () => {
        const categoryPick = vscode.window.createQuickPick();
        categoryPick.title = 'Project Categories';
        categoryPick.placeholder = 'Your categories';
        const categories = vscode.workspace.getConfiguration('devspace').get('projectCategories');
        let categorySelect = [];
        categories?.map(category => {
            let buttonUI = [
                {
                    tooltip: "Rename Category",
                    iconPath: new vscode.ThemeIcon(`devspace-category-edit`)
                },
                {
                    tooltip: "Remove Category",
                    iconPath: new vscode.ThemeIcon(`devspace-category-remove`)
                }
            ];
            categorySelect.push({ label: category, buttons: buttonUI });
        });
        categoryPick.buttons = [
            {
                tooltip: "Add Category",
                iconPath: new vscode.ThemeIcon(`devspace-category-add`)
            },
            {
                tooltip: "Back to Project Box",
                iconPath: new vscode.ThemeIcon(`devspace-project-container`)
            }
        ];
        categoryPick.items = categorySelect;
        categoryPick.onDidTriggerButton(async (button) => {
            if (button.tooltip === "Add Category") {
                let categoryInput = vscode.window.createInputBox();
                categoryInput.title = "Add Category";
                categoryInput.placeholder = "Category name";
                categoryInput.buttons = [
                    {
                        tooltip: "Back to Project Categories",
                        iconPath: new vscode.ThemeIcon(`devspace-category-container`)
                    }
                ];
                categoryInput.onDidTriggerButton(async (button) => {
                    if (button.tooltip === "Back to Project Categories") {
                        await vscode.commands.executeCommand('devspace.showCategories');
                    }
                    categoryInput.hide();
                });
                categoryInput.onDidChangeValue(async (value) => {
                    const categories = vscode.workspace.getConfiguration('devspace').get('projectCategories');
                    if (categories?.find(category => category.toLowerCase() === value.toLowerCase())) {
                        categoryInput.validationMessage = 'Category already exists';
                        return;
                    }
                    categoryInput.validationMessage = undefined;
                });
                categoryInput.onDidAccept(async () => {
                    const newCategory = categoryInput.value.trim();
                    if (!newCategory) {
                        return;
                    }
                    const categories = vscode.workspace.getConfiguration('devspace').get('projectCategories');
                    const updatedCategories = categories ? [...categories, newCategory] : [newCategory];
                    await vscode.workspace.getConfiguration('devspace').update('projectCategories', updatedCategories, true);
                    categoryInput.hide();
                    await vscode.commands.executeCommand('devspace.showCategories');
                });
                categoryInput.onDidHide(() => categoryInput.dispose());
                categoryInput.show();
            }
            else if (button.tooltip === "Back to Project Box") {
                await vscode.commands.executeCommand('devspace.showProjectBox');
            }
            categoryPick.hide();
        });
        categoryPick.onDidTriggerItemButton(async (button) => {
            if (button.button.tooltip === "Rename Category") {
                const oldCategory = button.item.label;
                let categoryInput = vscode.window.createInputBox();
                categoryInput.title = `Rename Category "${oldCategory}"`;
                categoryInput.placeholder = "New category name";
                categoryInput.buttons = [
                    {
                        tooltip: "Back to Project Categories",
                        iconPath: new vscode.ThemeIcon(`devspace-category-container`)
                    }
                ];
                categoryInput.onDidTriggerButton(async (button) => {
                    if (button.tooltip === "Back to Project Categories") {
                        await vscode.commands.executeCommand('devspace.showCategories');
                    }
                    categoryInput.hide();
                });
                categoryInput.onDidChangeValue(async (value) => {
                    const categories = vscode.workspace.getConfiguration('devspace').get('projectCategories');
                    if (categories?.find(category => category.toLowerCase() === value.toLowerCase())) {
                        categoryInput.validationMessage = 'Category already exists';
                        return;
                    }
                    categoryInput.validationMessage = undefined;
                });
                categoryInput.onDidAccept(async () => {
                    const newCategory = categoryInput.value.trim();
                    if (!newCategory) {
                        return;
                    }
                    const categories = vscode.workspace.getConfiguration('devspace').get('projectCategories');
                    const updatedCategories = categories ? categories.map(category => category === oldCategory ? newCategory : category) : [newCategory];
                    await vscode.workspace.getConfiguration('devspace').update('projectCategories', updatedCategories, true);
                    const projects = vscode.workspace.getConfiguration('devspace').get('projects');
                    if (projects) {
                        projects.map(project => {
                            if (project.category === oldCategory) {
                                project.category = newCategory;
                            }
                        });
                        await vscode.workspace.getConfiguration('devspace').update('projects', projects, true);
                    }
                    categoryInput.hide();
                    await vscode.commands.executeCommand('devspace.showCategories');
                });
                categoryInput.onDidHide(() => categoryInput.dispose());
                categoryInput.show();
            }
            else if (button.button.tooltip === "Remove Category") {
                const categoryToRemove = button.item.label;
                const categories = vscode.workspace.getConfiguration('devspace').get('projectCategories');
                const updatedCategories = categories ? categories.filter(category => category !== categoryToRemove) : [];
                await vscode.workspace.getConfiguration('devspace').update('projectCategories', updatedCategories, true);
                const projects = vscode.workspace.getConfiguration('devspace').get('projects');
                if (projects) {
                    projects.map(project => {
                        if (project.category === categoryToRemove) {
                            project.category = 'Uncategorized';
                        }
                    });
                    await vscode.workspace.getConfiguration('devspace').update('projects', projects, true);
                }
                await vscode.commands.executeCommand('devspace.showCategories');
            }
        });
        categoryPick.onDidAccept(() => categoryPick.hide());
        categoryPick.onDidHide(() => categoryPick.dispose());
        categoryPick.show();
    });
    /* EVENTS */
    /**
     * On Did Change Configuration
     * Param: configE: vscode.ConfigurationChangeEvent
     * Variable: Project Box Status
     * Function: Fix Project Categories
     */
    vscode.workspace.onDidChangeConfiguration(async (configE) => {
        if (configE.affectsConfiguration('devspace.projects') || configE.affectsConfiguration('devspace.categorizeProjects') || configE.affectsConfiguration('devspace.projectCategories')) {
            await fixProjectCategories();
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
/**
 * Fix Project Categories
 * Configuration: Projects, Project Categories
 */
async function fixProjectCategories() {
    const projects = vscode.workspace.getConfiguration('devspace').get('projects');
    const categories = vscode.workspace.getConfiguration('devspace').get('projectCategories');
    if (!categories || !categories.includes('Uncategorized')) {
        categories?.push('Uncategorized');
    }
    await vscode.workspace.getConfiguration('devspace').update('projectCategories', categories, true);
    if (!projects || !categories) {
        return;
    }
    projects.map(project => {
        if (!categories.find(category => category === project.category)) {
            project.category = 'Uncategorized';
        }
    });
    await vscode.workspace.getConfiguration('devspace').update('projects', projects, true);
}
//# sourceMappingURL=activateProjectBox.js.map