"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodePath = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
class NodePath {
    constructor(nodeRoot) {
        this.nodeRoot = nodeRoot;
        this.nodePath = this.setNodeRoot(nodeRoot) ? this.getNodePathAsString() : this.getInitialNodePath() ? this.getInitialNodePath() : "";
    }
    getInitialNodePath() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return "";
        const arrayNodeRoot = workspaceFolders[0];
        const initialNodeRoot = arrayNodeRoot ? arrayNodeRoot.uri.fsPath : "";
        const initialNodePath = initialNodeRoot ? this.makeNodePath(initialNodeRoot) : "";
        return this.checkNodePath(initialNodePath) ? initialNodePath : "";
    }
    getNodePath() {
        return new NodePath(this.nodeRoot);
    }
    getNodePathAsString() {
        return this.nodePath;
    }
    getNodeRoot() {
        return this.nodeRoot;
    }
    setNodeRoot(nodeRoot) {
        this.nodeRoot = this.checkPath(nodeRoot) ? nodeRoot : "";
        this.nodePath = this.checkNodePath(this.makeNodePath(nodeRoot)) ? this.makeNodePath(nodeRoot) : "";
        return this.nodePath;
    }
    checkNodePath(nodePath) {
        return this.checkPath(nodePath) ? this.nodePath : "null";
    }
    makeNodePath(nodeRoot) {
        return path.join(nodeRoot, "package.json");
    }
    checkPath(path) {
        try {
            fs.accessSync(path);
            return true;
        }
        catch (err) {
            return false;
        }
    }
}
exports.NodePath = NodePath;
//# sourceMappingURL=NodePath.js.map