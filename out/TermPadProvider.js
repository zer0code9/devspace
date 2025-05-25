"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TermPadProvider = void 0;
const vscode = require("vscode");
class TermPadProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.nodePath = "";
        this.update();
    }
    update() {
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return Promise.resolve(this.getTerms());
    }
    getTerms() {
        const toTerm = (title, file, location) => {
            return new TermNode(title, file, location, vscode.TreeItemCollapsibleState.None);
        };
        const results = [];
        const searchTerms = ["todo", "fixme"]; //, "bug", "note", "review"
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
                    }
                    else if (lineNoSpace.indexOf(`*${termUpperCase}`) !== -1) {
                        line.substring(line.indexOf("*"));
                    }
                    else {
                        continue;
                    }
                    let columnIndex = lineUpperCase.indexOf(termUpperCase);
                    while (columnIndex !== -1) {
                        const text = line.trim().substring(columnIndex + termUpperCase.length).split(':')[1];
                        if (!text) {
                            break;
                        }
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
        });
        const nodes = results.map(r => toTerm(r.text, r.file, r.line + ":" + r.column));
        return nodes;
    }
}
exports.TermPadProvider = TermPadProvider;
const getFilePath = (path) => {
    vscode.workspace.workspaceFolders?.forEach(workspaceFolder => {
        if (path.indexOf(workspaceFolder.name) !== -1) {
            console.log(path.indexOf(workspaceFolder.name));
            console.log(path.slice(path.indexOf(workspaceFolder.name)));
            return path.slice(path.indexOf(workspaceFolder.name));
        }
    });
    return path;
};
class TermNode extends vscode.TreeItem {
    constructor(title, file, location, collapsibleState) {
        super(title, collapsibleState);
        this.title = title;
        this.file = file;
        this.location = location;
        this.collapsibleState = collapsibleState;
        this.tooltip = `${this.title} ${getFilePath(this.file)}:${this.location}`;
        this.description = this.file + ":" + this.location;
        this.contextValue = 'term';
    }
}
//# sourceMappingURL=TermPadProvider.js.map