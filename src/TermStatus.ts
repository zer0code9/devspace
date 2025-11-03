import * as vscode from 'vscode';
import { TermPadProvider } from './TermPadProvider';

export class TermStatus {
    constructor(private statusBarItem: vscode.StatusBarItem, private termPadProvider: TermPadProvider) {
        this.update();
        this.statusBarItem.show();
    }

    async update(): Promise<void> {
        let data = await this.getData();
        this.statusBarItem.text = `$(devspace-gear) ${data[0]} $(devspace-checkmark) ${data[1]}`;
        this.statusBarItem.command = 'devspace.termPad.focus';
        this.statusBarItem.tooltip = (data[0] + data[1]) ? `Issues: ${data[0] + data[1]}` : `No issues`;
    }

    async getData(): Promise<number[]> {
        let fixme = 0;
        let todo = 0;
        const files = await this.termPadProvider.getFiles();
        for (const file of files) {
            const terms = await this.termPadProvider.getTerms(file.info);
            for (const term of terms)
                if (term.title.includes('FIXME:')) ++fixme;
                else if (term.title.includes('TODO:')) ++todo;
        }
        return [fixme, todo];
    }
}