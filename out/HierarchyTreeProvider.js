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
    async getChildren(element) {
        if (element) {
            const items = element.symbol.children.map(child => new HierarchyItem(child, child.children.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None));
            return items.filter(item => vscode.SymbolKind[item.symbol.kind] !== "Property");
        }
        else {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return [];
            }
            this.currentDocument = editor.document;
            await this.loadSymbols();
            return this.symbols.map(symbol => new HierarchyItem(symbol, symbol.children.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None));
        }
    }
    async loadSymbols() {
        if (!this.currentDocument) {
            this.symbols = [];
            return;
        }
        try {
            const symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', this.currentDocument.uri);
            this.symbols = symbols || [];
        }
        catch (err) {
            console.error('Error loading symbols:', err);
            this.symbols = [];
        }
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
    constructor(symbol, collapsibleState) {
        super(symbol.name, collapsibleState);
        this.symbol = symbol;
        this.collapsibleState = collapsibleState;
        this.tooltip = `${this.symbol.name}`;
        this.description = `${vscode.SymbolKind[symbol.kind]}`;
        this.iconPath = new vscode.ThemeIcon(this.getIconForSymbolKind(symbol.kind));
        this.command = {
            command: 'devspace.goToSymbol',
            title: 'Go to Symbol',
            arguments: [symbol.range]
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