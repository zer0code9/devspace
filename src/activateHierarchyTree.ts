import * as vscode from 'vscode';
import { HierarchyTreeProvider } from './HierarchyTreeProvider';

export function activateHierarchyTree() {
    /* VARIABLES */

    /* Hierarchy Tree Provider/View */
    const hierarchyTreeProvider = new HierarchyTreeProvider();
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
    vscode.commands.registerCommand('devspace.goToSymbol', async (uri: vscode.Uri | undefined, range: vscode.Range) => {
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
        } catch (err) {
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
    vscode.window.onDidChangeTextEditorSelection(async selectionE => {
        const editor = selectionE.textEditor;
        if (!editor) { return; }

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
            } catch (err) {
                console.error('Error revealing hierarchy item:', err);
            }
        }
    });

    /**
     * On Did Change Configuration
     * Variable: Hierarchy Tree Provider
     */
    vscode.workspace.onDidChangeConfiguration(async configE => {
        if (configE.affectsConfiguration('devspace.autoCollapseTree')) {
            hierarchyTreeProvider.refresh();
            hierarchyTreeProvider.scan();
        }
    });

    /**
     * On Did Change Hierarchy Tree Visibility
     * Variable: Hierarchy Tree Provider, View Visible
     */
    hierarchyTreeView.onDidChangeVisibility(async visibilityE => {
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
                    } catch (err) {
                        console.error('Error revealing hierarchy item on view visibility change:', err);
                    }
                }
            }
        } else {
            viewVisible = false;
        }
    });
}