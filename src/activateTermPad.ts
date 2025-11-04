import * as vscode from 'vscode';
import { TermPadProvider, FileTerm } from './TermPadProvider';
import { TermStatus } from './TermStatus';

export function activateTermPad() {
    /* VARIABLES */

    /* Term Pad Provider */
    const termPadProvider = new TermPadProvider();
    vscode.window.registerTreeDataProvider('devspace.termPad', termPadProvider);
    termPadProvider.refresh();

    /* Project Box Status */
    const termStatus = new TermStatus(vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100), termPadProvider);

    /* COMMANDS */

    /**
     * Refresh Term Pad
     */
    vscode.commands.registerCommand('devspace.refreshTermPad', () => {
        termPadProvider.refresh();
    });

    /**
     * Go To File
     * Params: filenode: FileTerm
     */
    vscode.commands.registerCommand('devspace.goToFile', async (filenode: FileTerm) => {
        const document = await vscode.workspace.openTextDocument(filenode.info)
        vscode.window.showTextDocument(document);
    });

    /**
     * Go To Term
     * Params: location: string, file: string
     */
    vscode.commands.registerCommand('devspace.goToTerm', async (location: string, file: string) => {
        const document = await vscode.workspace.openTextDocument(file);
        const editor = await vscode.window.showTextDocument(document);

        const parts = location.split(' ');
        const line = parseInt(parts[1].replace(',', ''));
        const column = parseInt(parts[3].replace(']', ''));
        const position = new vscode.Position(line - 1, column - 1);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    });

    /* EVENTS */

    vscode.workspace.onDidSaveTextDocument(doc => {
        termPadProvider.refresh();
        termStatus.update();
    })
    vscode.workspace.onDidOpenTextDocument(doc => {
        termPadProvider.refresh();
        termStatus.update();
    })
    vscode.workspace.onDidCloseTextDocument(doc => {
        termPadProvider.refresh();
        termStatus.update();
    })
    vscode.workspace.onDidChangeTextDocument(doc => {
        termPadProvider.refresh();
        termStatus.update();
    })

    /**
     * On Did Change Configuration
     * Params: configE: vscode.ConfigurationChangeEvent
     * Configuration: Terms
     */
    vscode.workspace.onDidChangeConfiguration(async configE => {
        if (configE.affectsConfiguration('devspace.terms')) {
            const terms: string[] | undefined = vscode.workspace.getConfiguration('devspace').get('terms');
            const revisedTerms: string[] = [];
            revisedTerms.push("todo", "fixme");
            if (terms !== undefined) {
                for (const term of terms) {
                    if (["debug", "review", "hack", "note"].includes(term)) { revisedTerms.push(term); }
                }
            }
            await vscode.workspace.getConfiguration('devspace').update('terms', revisedTerms, true);
            termPadProvider.refresh();
            termStatus.update();
        }
    });
}