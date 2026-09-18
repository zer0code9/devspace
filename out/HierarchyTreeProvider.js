"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HierarchyItem = exports.HierarchyTreeProvider = void 0;
const fs = require("fs");
const vscode = require("vscode");
class HierarchyTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.symbols = [];
        this.allSymbols = [];
        this.items = [];
        this.scan();
    }
    getCurrentDocument() {
        return this.currentDocument;
    }
    getAllSymbols() {
        return this.allSymbols;
    }
    scan() {
        this.allSymbols = this.scanAllSymbols(this.symbols);
    }
    async ensureSymbolsForDocument(document) {
        if (!document) {
            return;
        }
        if (this.currentDocument && this.currentDocument.uri.toString() === document.uri.toString() && this.allSymbols.length > 0) {
            return;
        }
        this.currentDocument = document;
        await this.loadSymbols();
        this.scan();
        this.refresh();
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        // Rebuild items cache for each tree refresh
        if (!element) {
            this.items = [];
        }
        if (element) {
            const items = element.symbol.children.map(child => {
                const item = new HierarchyItem(child, child.children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, element, element.documentUri);
                this.items.push(item);
                return item;
            });
            return items.filter(item => vscode.SymbolKind[item.symbol.kind] !== "Property");
        }
        else {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return [];
            }
            this.currentDocument = editor.document;
            await this.loadSymbols();
            this.scan();
            return this.symbols.map(symbol => {
                const item = new HierarchyItem(symbol, symbol.children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, undefined, this.currentDocument?.uri);
                this.items.push(item);
                return item;
            });
        }
    }
    getParent(element) {
        return element.parent;
    }
    async loadSymbols() {
        if (!this.currentDocument) {
            this.symbols = [];
            return;
        }
        try {
            const symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', this.currentDocument.uri);
            this.symbols = symbols ? this.sortSymbolsByDocumentOrder(symbols) : [];
        }
        catch (err) {
            console.error('Error loading symbols:', err);
            this.symbols = [];
        }
    }
    findClosestSymbol(position) {
        if (!this.allSymbols || this.allSymbols.length === 0) {
            return undefined;
        }
        // Prefer symbols that contain the position (deepest one)
        const containing = this.allSymbols.filter(sym => sym.range.contains(position));
        if (containing.length > 0) {
            return containing[containing.length - 1];
        }
        // Otherwise pick the symbol with the latest start before the position
        let best = undefined;
        for (const symbol of this.allSymbols) {
            const start = symbol.range.start;
            if (!start.isAfter(position)) {
                if (!best) {
                    best = symbol;
                }
                else if (start.isAfter(best.range.start)) {
                    best = symbol;
                }
            }
        }
        return best || this.allSymbols[0];
    }
    sortSymbolsByDocumentOrder(symbols) {
        // Sort the array by line then column
        symbols.sort((a, b) => {
            if (a.range.start.line !== b.range.start.line) {
                return a.range.start.line - b.range.start.line;
            }
            return a.range.start.character - b.range.start.character;
        });
        // Sort siblings
        for (const symbol of symbols) {
            if (symbol.children && symbol.children.length > 0) {
                this.sortSymbolsByDocumentOrder(symbol.children);
            }
        }
        return symbols;
    }
    scanAllSymbols(symbols) {
        let allSymbols = [];
        for (const symbol of symbols) {
            allSymbols.push(symbol);
            if (symbol.children && symbol.children.length > 0) {
                allSymbols = allSymbols.concat(this.scanAllSymbols(symbol.children));
            }
        }
        return allSymbols;
    }
    getItemBySymbol(symbol) {
        const matches = (a, b) => {
            return a.name === b.name && a.range.start.line === b.range.start.line && a.range.start.character === b.range.start.character;
        };
        const findIn = (items) => {
            for (const item of items) {
                if (matches(item.symbol, symbol)) {
                    return item;
                }
                const childItems = item.symbol.children.map(child => new HierarchyItem(child, child.children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, item, item.documentUri));
                const found = findIn(childItems);
                if (found) {
                    return found;
                }
            }
            return undefined;
        };
        const found = findIn(this.items);
        if (found) {
            return found;
        }
        return new HierarchyItem(symbol, symbol.children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, undefined, this.currentDocument?.uri);
    }
    pathExists(path) {
        try {
            fs.accessSync(path);
        }
        catch (err) {
            return false;
        }
        return true;
    }
}
exports.HierarchyTreeProvider = HierarchyTreeProvider;
class HierarchyItem extends vscode.TreeItem {
    constructor(symbol, collapsibleState, parent, documentUri) {
        super(symbol.name, collapsibleState);
        this.symbol = symbol;
        this.collapsibleState = collapsibleState;
        this.parent = parent;
        this.documentUri = documentUri;
        this.tooltip = `${this.symbol.name} ${this.symbol.range.start.line + 1}:${this.symbol.range.start.character + 1} - ${this.symbol.range.end.line + 1}:${this.symbol.range.end.character + 1}`;
        this.description = `${vscode.SymbolKind[this.symbol.kind]}`;
        this.iconPath = new vscode.ThemeIcon(this.getIconForSymbolKind(this.symbol.kind));
        this.command = {
            command: 'devspace.goToSymbol',
            title: 'Go to Symbol',
            arguments: [this.documentUri, this.symbol.range]
        };
    }
    getIconForSymbolKind(kind) {
        const iconMap = {
            [vscode.SymbolKind.File]: 'file',
            [vscode.SymbolKind.Module]: 'package',
            [vscode.SymbolKind.Namespace]: 'namespace',
            [vscode.SymbolKind.Package]: 'package',
            [vscode.SymbolKind.Class]: 'symbol-class',
            [vscode.SymbolKind.Method]: 'symbol-method',
            [vscode.SymbolKind.Property]: 'symbol-property',
            [vscode.SymbolKind.Field]: 'symbol-field',
            [vscode.SymbolKind.Constructor]: 'symbol-constructor',
            [vscode.SymbolKind.Enum]: 'symbol-enum',
            [vscode.SymbolKind.Interface]: 'symbol-interface',
            [vscode.SymbolKind.Function]: 'symbol-function',
            [vscode.SymbolKind.Variable]: 'symbol-variable',
            [vscode.SymbolKind.Constant]: 'symbol-constant',
            [vscode.SymbolKind.String]: 'symbol-string',
            [vscode.SymbolKind.Number]: 'symbol-number',
            [vscode.SymbolKind.Boolean]: 'symbol-boolean',
            [vscode.SymbolKind.Array]: 'symbol-array',
            [vscode.SymbolKind.Object]: 'symbol-object',
            [vscode.SymbolKind.Key]: 'symbol-key',
            [vscode.SymbolKind.Null]: 'symbol-null',
            [vscode.SymbolKind.EnumMember]: 'symbol-enum-member',
            [vscode.SymbolKind.Struct]: 'symbol-struct',
            [vscode.SymbolKind.Event]: 'symbol-event',
            [vscode.SymbolKind.Operator]: 'symbol-operator',
            [vscode.SymbolKind.TypeParameter]: 'symbol-type-parameter',
        };
        return iconMap[kind] || 'symbol-misc';
    }
}
exports.HierarchyItem = HierarchyItem;
//# sourceMappingURL=HierarchyTreeProvider.js.map