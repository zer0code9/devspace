import { config, getConfig } from './config';
import { window, commands, Position, TreeItem, DiagnosticCollection, Diagnostic, Uri } from 'vscode';
import fs from 'fs';
import path from 'path';

let config = {
    // Snippets
    snippetsLanguages: [],
    allowSnippets: true
}

// SNIPPETS
class SnippetHandler {
    status;

    constructor() {
        this.status = window.createStatusBarItem(StatusBarAlignment.Right, 100);
    }

    updateStatus(active) {
        const icon = active ? '$(check)' : '$(circle-slash)'
        const message = active ? "Snippets are enabled" : "Snippets are not enabled";
        this.status.text = `${icon} DevSpace`
        this.status.tooltip = message;
        if (active) this.status.show(); else this.status.hide();
        return this.status;
    }

    getStatus() {
        return this.status;
    }
}