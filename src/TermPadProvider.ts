import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

interface FileResult {
    title: string;
    file: string;
}

interface TermResult {
    text: string;
    file: string;
    line: number;
    column: number;
}

const commentsSingle = {
    primary: '//', // js/ts, java, kotlin, c, cpp
    python: '#',
    ruby: '#'
}

const commentsMulti = {
    primary: ['/*', '*/'],
    python: ['"""', '"""'],
    ruby: ['=begin', '=end'],
    html: ['<!--', '-->'],
    css: ['/*', '*/'] // css, scss
}

export class TermPadProvider implements vscode.TreeDataProvider<FileTerm> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileTerm | undefined | null | void> = new vscode.EventEmitter<FileTerm | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FileTerm | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {
        this.update();
    }

    update(): void {
        
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FileTerm): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FileTerm): Thenable<FileTerm[]> {
        if (element) { return Promise.resolve(this.getTerms(element.info)); }
        return Promise.resolve(this.getFiles());
    }

    async getFiles(): Promise<FileTerm[]> {
        const toNode = (title: string, file: string): FileTerm => {
            return new FileTerm(title, file, "", vscode.TreeItemCollapsibleState.Expanded, "filenode");
        }

        const files: FileResult[] = [];
        for (const group of vscode.window.tabGroups.all) {
            for (const tab of group.tabs) {
                try {
                    fs.accessSync(tab.input instanceof vscode.TabInputText ? tab.input.uri.fsPath : '');
                } catch (err) {
                    continue;
                }
                const filePath = tab.input instanceof vscode.TabInputText ? tab.input.uri.fsPath : '';
                const terms = await this.getTerms(filePath);
                if (terms.length > 0) { files.push({title: path.basename(filePath), file: filePath}); }
            }
        }
        const nodes = files.map(f => toNode(f.title, f.file));
        return nodes;
    }

    async getTerms(filePath: string): Promise<FileTerm[]> {
        const toNode = (text: string, location: string, file: string): FileTerm => {
            return new FileTerm(text, location, file, vscode.TreeItemCollapsibleState.None, "termnode");
        }

        let single = commentsSingle.primary;
        let multi = commentsMulti.primary;
        if (filePath.endsWith('.py')) {
            single = commentsSingle.python;
            multi = commentsMulti.python;
        } else if (filePath.endsWith('.rb')) {
            single = commentsSingle.ruby;
            multi = commentsMulti.ruby;
        } else if (filePath.endsWith('.html')) { multi = commentsMulti.html; }
        else if (filePath.endsWith('.css') || filePath.endsWith('.scss')) { multi = commentsMulti.css; }

        const results: TermResult[] = [];
        const terms: string[] | undefined = vscode.workspace.getConfiguration('devspace').get('terms');
        if (!terms) { return []; }
        for (const term of terms) {
            const document = await vscode.workspace.openTextDocument(filePath);;
            const lines = document.getText().split('\n');
            
            /* single comment */
            for (let i = 0; i < lines.length && !filePath.endsWith('.html') && !(filePath.endsWith('.css') || filePath.endsWith('.scss')); i++) {
                const line = lines[i];
                const lineUpperCase = line.toUpperCase();
                const termUpperCase = term.toUpperCase();

                const lineNoSpace = lineUpperCase.replace(/\s/g, '');
                if (lineNoSpace.indexOf(`${single}${termUpperCase}:`) === -1) { continue; }
                
                let columnIndex = lineUpperCase.indexOf(termUpperCase);
                while (columnIndex !== -1) {
                    const text = line.substring(columnIndex).split(':', 2)[1].trim();
                    if (!text) { break; }
                    results.push({
                        text: termUpperCase + ": " + text.trim(),
                        line: i + 1,
                        column: columnIndex + 1,
                        file: document.uri.fsPath
                    });
                    columnIndex = lineUpperCase.indexOf(termUpperCase, columnIndex + 1);
                }
            }

            /* multi comment */
            const start = multi[0];
            const end = multi[1];
            let startIndex = lines.findIndex((line) => line.includes(start));
            let endIndex = lines.findIndex((line) => line.includes(end));
            while (startIndex !== -1 && endIndex !== -1) {
                if (startIndex > endIndex) {
                    startIndex = lines.findIndex((line, index) => line.includes(start) && index > startIndex);
                    endIndex = lines.findIndex((line, index) => line.includes(end) && index > endIndex);
                    continue;
                }
                for (let i = startIndex; i <= endIndex; i++) {
                    const line = lines[i];
                    const lineUpperCase = line.toUpperCase();
                    const termUpperCase = term.toUpperCase();

                    
                    let columnIndex = lineUpperCase.indexOf(termUpperCase);
                    while (columnIndex !== -1) {
                        const text = line.substring(columnIndex).split(':', 2)[1]?.replace(end, '');
                        if (!text) { break; }
                        results.push({
                            text: termUpperCase + ": " + text.trim(),
                            line: i + 1,
                            column: columnIndex + 1,
                            file: document.uri.fsPath
                        });
                        columnIndex = lineUpperCase.indexOf(termUpperCase, columnIndex + 1);
                    }
                }
                startIndex = lines.findIndex((line, index) => line.includes(start) && index > startIndex);
                endIndex = lines.findIndex((line, index) => line.includes(end) && index > endIndex);
            }
        }

        const nodes = results.map(r => toNode(r.text, `[Ln ${r.line}, Col ${r.column}]`, r.file)).sort((a, b) => parseInt(a.info.split(' ')[1].replace(',', '')) - parseInt(b.info.split(' ')[1].replace(',', '')));
        return nodes;
    }
}

const getBetterFilePath = (path: string): string => {
    vscode.workspace.workspaceFolders?.forEach(workspaceFolder => {
        if (path.includes(workspaceFolder.name)) {
            path = path.replace('\\', '/').slice(path.search(workspaceFolder.name));
            const partPath = path.split('/');
            partPath.pop();
            path = partPath.join(' • ');
            return path;
        }
    });
    return path;
}

export class FileTerm extends vscode.TreeItem {
    constructor(public readonly title: string, public readonly info: string, public readonly extra: string, public readonly collapsibleState: vscode.TreeItemCollapsibleState, public readonly context: string) {
        super(title, collapsibleState);
        this.description = (this.context === "filenode") ? getBetterFilePath(this.info) : this.info;
        this.tooltip = `${this.title} ${this.info}`;
        this.contextValue = this.context;
        this.chooseIcon();
    }

    chooseIcon() {
        if (this.context === "termnode") {
            const term = this.title.split(':')[0].toLowerCase();
            this.iconPath = {
                light: vscode.Uri.file(path.join(__filename, '..', '..', 'img', 'misc', `${term}.svg`)),
                dark: vscode.Uri.file(path.join(__filename, '..', '..', 'img', 'misc', `${term}.svg`))
            }
            this.command = {
                command: 'devspace.goToTerm',
                title: 'Go to Term',
                arguments: [this.info, this.extra]
            };
        }
    }
}