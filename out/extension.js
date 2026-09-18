"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const activatePackageView_1 = require("./activatePackageView");
const activateProjectBox_1 = require("./activateProjectBox");
const activateTermPad_1 = require("./activateTermPad");
const activateHierarchyTree_1 = require("./activateHierarchyTree");
function activate(context) {
    /* ACTIVATIONS */
    (0, activatePackageView_1.activatePackageView)();
    (0, activateProjectBox_1.activateProjectBox)();
    (0, activateTermPad_1.activateTermPad)();
    (0, activateHierarchyTree_1.activateHierarchyTree)();
    /* COMMANDS */
    /**
     * Open Dev Space Settings
     * Keybinding: Ctrl+Alt+S
     * Command: Workbench.Action.Open Settings
     */
    vscode.commands.registerCommand('devspace.openDevSpaceSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:slashdev.devspace');
    });
}
function deactivate() { }
//# sourceMappingURL=extension.js.map