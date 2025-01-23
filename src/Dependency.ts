import * as vscode from 'vscode';

export class Dependency extends vscode.TreeItem {
    constructor(public readonly name: string, private version: string) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `${this.name} ${this.version}`;
        this.description = this.version;
        this.contextValue = 'node';
    }
}