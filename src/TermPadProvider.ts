import * as fs from 'fs';
import { get } from 'http';
import * as path from 'path';
import * as vscode from 'vscode';

interface TermResult {
    file: string;
    line: number;
    column: number;
    text: string;
}

export class TermPadProvider implements vscode.TreeDataProvider<TermNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<TermNode | undefined | null | void> = new vscode.EventEmitter<TermNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TermNode | undefined | null | void> = this._onDidChangeTreeData.event;

    private nodeRoot: string | undefined;
    private nodePath : string = "";

    constructor() {
        this.update();
    }

    update(): void {
        
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TermNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TermNode): Thenable<TermNode[]> {
        return Promise.resolve(this.getTerms());
    }

    private getTerms(): TermNode[] {
        const toTerm = (title: string, file: string, location: string): TermNode => {
            return new TermNode(title, file, location, vscode.TreeItemCollapsibleState.None);
        }

        const results: TermResult[] = [];
        const searchTerms = ["todo", "fixme"] //, "bug", "note", "review"
        searchTerms.forEach((searchTerm) => {
            for (const editor of vscode.window.visibleTextEditors) {
                const document = editor.document;
                const text = document.getText();
                const lines = text.split('\n');
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const lineUpperCase = line.toUpperCase();
                    const termUpperCase = searchTerm.toUpperCase();

                    const lineNoSpace = lineUpperCase.replace(/\s/g, '');
                    if (lineNoSpace.indexOf(`//${termUpperCase}`) !== -1) {
                        line.substring(line.indexOf("//"));
                    } else if (lineNoSpace.indexOf(`*${termUpperCase}`) !== -1) {
                        line.substring(line.indexOf("*"));
                    } else {
                        continue;
                    }
                    
                    let columnIndex = lineUpperCase.indexOf(termUpperCase);
                    while (columnIndex !== -1) {
                        const text = line.trim().substring(columnIndex + termUpperCase.length).split(':')[1];
                        if (!text) { break; }
                        results.push({
                            file: document.fileName,
                            line: i + 1,
                            column: columnIndex + 1,
                            text: termUpperCase + ": " + text.trim()
                        });
                        columnIndex = lineUpperCase.indexOf(termUpperCase, columnIndex + 1);
                    }
                }
            }
        })
        

        const nodes = results.map(r => toTerm(r.text, r.file, r.line + ":" + r.column));
        return nodes;
    }
}

const getFilePath = (path: string): string => {
    vscode.workspace.workspaceFolders?.forEach(workspaceFolder => {
        if (path.indexOf(workspaceFolder.name) !== -1) {
            console.log(path.indexOf(workspaceFolder.name));
            console.log(path.slice(path.indexOf(workspaceFolder.name)));
            return path.slice(path.indexOf(workspaceFolder.name));
        }
    });
    return path;
}

class TermNode extends vscode.TreeItem {
    constructor(public readonly title: string, public readonly file: string, public location: string, public readonly collapsibleState: vscode.TreeItemCollapsibleState) {
        super(title, collapsibleState);
        this.tooltip = `${this.title} ${getFilePath(this.file)}:${this.location}`;
        this.description = this.file + ":" + this.location;
        this.contextValue = 'term';
    }
}