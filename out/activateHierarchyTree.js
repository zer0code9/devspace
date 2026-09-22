"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateHierarchyTree = activateHierarchyTree;
const vscode = __importStar(require("vscode"));
const HierarchyTreeProvider_1 = require("./HierarchyTreeProvider");
function activateHierarchyTree() {
    /* VARIABLES */
    /* Hierarchy Tree Provider/View */
    const hierarchyTreeProvider = new HierarchyTreeProvider_1.HierarchyTreeProvider();
    const hierarchyTreeView = vscode.window.createTreeView('devspace.hierarchyTree', { treeDataProvider: hierarchyTreeProvider, showCollapseAll: true });
    /* View Visible */
    let viewVisible = false;
    /* COMMANDS */
    /**
     * Refresh Hierarchy Tree
     * Variable: Hierarchy Tree Provider
     */
    vscode.commands.registerCommand('devspace.refreshHierarchyTree', () => {
        hierarchyTreeProvider.refresh();
        hierarchyTreeProvider.scan();
    });
    /**
     * Go To Symbol
     * Params: uri: vscode.Uri | undefined, range: vscode.Range
     */
    vscode.commands.registerCommand('devspace.goToSymbol', async (uri, range) => {
        let editor = vscode.window.activeTextEditor;
        try {
            if (uri) {
                const doc = await vscode.workspace.openTextDocument(uri);
                editor = await vscode.window.showTextDocument(doc, { preserveFocus: false });
            }
            if (editor) {
                editor.selection = new vscode.Selection(range.start, range.start);
                editor.revealRange(new vscode.Range(range.start, range.start));
            }
        }
        catch (err) {
            console.error('Error navigating to symbol:', err);
        }
    });
    /* EVENTS */
    /**
     * On Did Change Active Text Editor
     * Variable: Hierarchy Tree Provider
     */
    vscode.window.onDidChangeActiveTextEditor(editorE => {
        hierarchyTreeProvider.refresh();
        hierarchyTreeProvider.scan();
    });
    /**
     * On Did Change Text Document
     * Variable: Hierarchy Tree Provider
     */
    vscode.workspace.onDidChangeTextDocument(documentE => {
        hierarchyTreeProvider.refresh();
        hierarchyTreeProvider.scan();
    });
    /**
     * On Did Change Text Editor Selection
     * Variable: Hierarchy Tree Provider, View Visible
     */
    vscode.window.onDidChangeTextEditorSelection(async (selectionE) => {
        const editor = selectionE.textEditor;
        if (!editor) {
            return;
        }
        await hierarchyTreeProvider.ensureSymbolsForDocument(editor.document);
        const position = selectionE.selections[0].active;
        const closest = hierarchyTreeProvider.findClosestSymbol(position);
        if (closest) {
            const item = hierarchyTreeProvider.getItemBySymbol(closest);
            try {
                if (viewVisible) {
                    if (vscode.workspace.getConfiguration('devspace').get('autoCollapseTree')) {
                        await vscode.commands.executeCommand('workbench.actions.treeView.devspace.hierarchyTree.collapseAll');
                    }
                    await hierarchyTreeView.reveal(item, { select: true, focus: false, expand: true });
                }
            }
            catch (err) {
                console.error('Error revealing hierarchy item:', err);
            }
        }
    });
    /**
     * On Did Change Configuration
     * Variable: Hierarchy Tree Provider
     */
    vscode.workspace.onDidChangeConfiguration(async (configE) => {
        if (configE.affectsConfiguration('devspace.autoCollapseTree')) {
            hierarchyTreeProvider.refresh();
            hierarchyTreeProvider.scan();
        }
    });
    /**
     * On Did Change Hierarchy Tree Visibility
     * Variable: Hierarchy Tree Provider, View Visible
     */
    hierarchyTreeView.onDidChangeVisibility(async (visibilityE) => {
        if (visibilityE.visible) {
            viewVisible = true;
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const position = editor.selection.active;
                const closest = hierarchyTreeProvider.findClosestSymbol(position);
                if (closest) {
                    const item = hierarchyTreeProvider.getItemBySymbol(closest);
                    try {
                        await hierarchyTreeView.reveal(item, { select: true, focus: false, expand: true });
                    }
                    catch (err) {
                        console.error('Error revealing hierarchy item on view visibility change:', err);
                    }
                }
            }
        }
        else {
            viewVisible = false;
        }
    });
}
//# sourceMappingURL=activateHierarchyTree.js.map