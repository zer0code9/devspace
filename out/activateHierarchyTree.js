"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const HierarchyTreeProvider_1 = require("./HierarchyTreeProvider");
function activateHierarchyTree() {
    /* VARIABLES */
    /* Hierarchy Tree Provider */
    const hierarchyTreeProvider = new HierarchyTreeProvider_1.HierarchyTreeProvider();
    vscode.window.registerTreeDataProvider('devspace.hierarchyTree', hierarchyTreeProvider);
    /* COMMANDS */
    /**
     * Refresh Hierarchy Tree
     */
    vscode.commands.registerCommand('devspace.refreshHierarchyTree', () => {
        hierarchyTreeProvider.refresh();
    });
    /**
     * Go To Symbol
     * Params: range: vscode.Range
     */
    vscode.commands.registerCommand('devspace.goToSymbol', (range) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.selection = new vscode.Selection(range.start, range.start);
            editor.revealRange(new vscode.Range(range.start, range.start));
            vscode.window.showTextDocument(editor.document, {
                viewColumn: editor.viewColumn,
                preserveFocus: false
            });
        }
    });
    /* EVENTS */
    vscode.window.onDidChangeActiveTextEditor(editor => { hierarchyTreeProvider.refresh(); });
    vscode.workspace.onDidChangeTextDocument(doc => { hierarchyTreeProvider.refresh(); });
}
//# sourceMappingURL=activateHierarchyTree.js.map