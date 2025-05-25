import * as vscode from 'vscode';
import { TermPadProvider } from './TermPadProvider';

export function activateTermPad() {
    const termPadProvider = new TermPadProvider();
    vscode.window.registerTreeDataProvider('devspace.termPad', termPadProvider);
    termPadProvider.refresh();

    vscode.commands.registerCommand('devspace.refreshTermPad', () => {
        termPadProvider.refresh();
    });
}