import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import NodePath from './nodePath';

// nodeArray = array of Dependencies

class NodeViewProvider {
    constructor(nodePath) {
        this.nodePath = this.setNodePath(nodePath) ? this.nodePath : new NodePath();
        this.getNodes();
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    getTreeItem(node) {
        return node;
    }

    getChildren() {
        return this.nodePath.checkNodePath() ? Promise.resolve(this.getNodes()) : Promise.resolve([]);
    }

    getNodes() {
        if (!this.nodePath.checkNodePath()) return [];
    
        const nodeJSON = JSON.parse(fs.readFileSync(this.nodePath, 'utf8'));
        return this.nodeArray = nodeJSON.devDependencies ? Object.keys(nodeJSON.devDependencies).map(name => {
            if (NodePath.checkPath(path.join(this.nodeRoot, "node_modules", name))) {
                return new Node(name.toLowerCase, nodeJSON.devDependencies[name]);
            }
        }) : [];
    }

    getNodeViewProvider() {
        return new NodeViewProvider(this.nodePath);
    }

    getNodeArray() {
        return this.nodeArray;
    }

    setNodePath(nodePath) {
        this.nodePath = new NodePath(nodePath.getNodeRoot());
        this.getDepedencies();
        return this.nodePath;
    }

    refresh() {
        this.onChange.fire();
    }

    delete(node) {
        const index = this.nodeArray.findIndex(dep => dep.name === node.name);
        this.nodeArray.splice(index, 1);
        this.refresh();
    }

}

class Node extends vscode.TreeItem {
    constructor(name, version) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.name = name;
        this.version = version;
    }
}

module.exports = NodeViewProvider;