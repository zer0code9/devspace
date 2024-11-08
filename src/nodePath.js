import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// nodeRoot = path to workspace folder
// nodePath = nodeRoot + package.json

class NodePath {
    constructor(nodeRoot) {
        this.nodeRoot = nodeRoot;
        this.nodePath = this.setNodeRoot(nodeRoot) ? this.nodePath : this.getInitialNodePath() ? this.getInitialNodePath() : null;
    }

    getInitialNodePath() {
        const initialNodeRoot = vscode.workspace ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
        const initialNodePath = initialNodeRoot ? this.makeNodePath(initialNodeRoot) : null;
        return this.checkNodePath(initialNodePath) ? initialNodePath : null;
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
        this.nodeRoot = this.checkPath(nodeRoot) ? nodeRoot : undefined;
        this.nodePath = this.checkNodePath(this.makeNodePath(nodeRoot)) ? this.makeNodePath(nodeRoot) : null;
        return this.nodePath;
    }

    checkNodePath() {
        return this.pathExists(this.nodePath) ? this.nodePath : null;
    }

    makeNodePath(nodeRoot) {
        return path.join(nodeRoot, "package.json");
    }

    checkPath(path) {
        try {
            fs.accessSync(path);
            return true;
        } catch (err) {
            return false;
        }
    }
}

module.exports = NodePath;