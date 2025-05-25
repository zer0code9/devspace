"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dependency = exports.NodeViewProvider = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
class NodeViewProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.nodePath = "";
        this.update();
    }
    update() {
        this.nodeRoot = vscode.workspace.getConfiguration('devspace').get('nodeRoot');
        this.nodePath = this.pathExists(path.join(`${this.nodeRoot}`, "package.json")) ? path.join(`${this.nodeRoot}`, "package.json") : "";
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (this.nodePath && this.pathExists(this.nodePath)) {
            return Promise.resolve(this.getNodes(this.nodePath));
        }
        else {
            return Promise.resolve([]);
        }
    }
    getNodes(nodePath) {
        if (this.pathExists(nodePath)) {
            const toNode = (name, version) => {
                return new Dependency(name, version);
            };
            const nodePathJson = JSON.parse(fs.readFileSync(nodePath, 'utf-8'));
            const deps = nodePathJson.dependencies ?
                Object.keys(nodePathJson.dependencies).map(dep => toNode(dep, nodePathJson.dependencies[dep]))
                : [];
            const devDeps = nodePathJson.devDependencies ?
                Object.keys(nodePathJson.devDependencies).map(dep => toNode(dep, nodePathJson.devDependencies[dep]))
                : [];
            return deps.concat(devDeps);
        }
        else {
            return [];
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
exports.NodeViewProvider = NodeViewProvider;
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
//# sourceMappingURL=NodeViewProvider.js.map