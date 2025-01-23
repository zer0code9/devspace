"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dependency = void 0;
const vscode = require("vscode");
class Dependency extends vscode.TreeItem {
    constructor(name, version) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.name = name;
        this.version = version;
        this.tooltip = `${this.name} ${this.version}`;
        this.description = this.version;
        this.contextValue = 'node';
    }
}
exports.Dependency = Dependency;
//# sourceMappingURL=Dependency.js.map