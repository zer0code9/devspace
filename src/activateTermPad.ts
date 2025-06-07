import * as vscode from 'vscode';
import { TermPadProvider, FileTerm } from './TermPadProvider';

export function activateTermPad() {
    /* VARIABLES */

    /* Term Pad Provider */
    const termPadProvider = new TermPadProvider();
    vscode.window.registerTreeDataProvider('devspace.termPad', termPadProvider);
    termPadProvider.refresh();

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
    vscode.commands.registerCommand('devspace.goToFile', (filenode: FileTerm) => {
        vscode.workspace.openTextDocument(filenode.info).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    });

    /**
     * Go To Term
     * Params: location: string, file: string
     */
    vscode.commands.registerCommand('devspace.goToTerm', (location: string, file: string) => {
        vscode.workspace.openTextDocument(file).then(doc => {
            vscode.window.showTextDocument(doc);
            const parts = location.split(' ');
            const line = parseInt(parts[1].replace(',', ''));
            const column = parseInt(parts[3].replace(']', ''));
            const position = new vscode.Position(line - 1, column - 1);
            if (vscode.window.activeTextEditor === undefined) { return; }
            vscode.window.activeTextEditor.selection = new vscode.Selection(position, position);
            vscode.window.activeTextEditor.revealRange(new vscode.Range(position, position));
        });
    });

    /* EVENTS */

    vscode.workspace.onDidSaveTextDocument(doc => { termPadProvider.refresh(); })
    vscode.workspace.onDidOpenTextDocument(doc => { termPadProvider.refresh(); })
    vscode.workspace.onDidCloseTextDocument(doc => { termPadProvider.refresh(); })
    vscode.workspace.onDidChangeTextDocument(doc => { termPadProvider.refresh(); })

    /**
     * On Did Change Configuration
     * Params: configE: vscode.ConfigurationChangeEvent
     * Configuration: Terms
     */
    vscode.workspace.onDidChangeConfiguration(async configE => {
        if (configE.affectsConfiguration('devspace.terms')) {
            const terms: string[] | undefined = await vscode.workspace.getConfiguration('devspace').get('terms');
            const revisedTerms: string[] = [];
            if (terms !== undefined) {
                for (const term of terms) {
                    if (["todo", "fixme", "debug", "review", "hack", "note"].includes(term)) {
                        revisedTerms.push(term);
                    }
                }
            }
            await vscode.workspace.getConfiguration('devspace').update('terms', revisedTerms, true);
            termPadProvider.refresh();
        }
    });
}