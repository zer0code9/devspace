import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import NodePath from './nodePath';

// nodeArray = array of Dependencies

class NodeViewProvider {
    constructor(nodePath) {
        this.nodePath = this.setNodePath(nodePath) ? this.nodePath : new NodePath();
        this.getDepedencies();
        this.onChange = new vscode.EventEmitter();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren() {
        return this.nodePath.checkNodePath() ? Promise.resolve(this.getDepedencies()) : Promise.resolve([]);
    }

    onDidChangeTreeData() {
        return this.onChange.event;
    }

    getDepedencies() {
        if (!this.nodePath.checkNodePath()) return [];
    
        const nodeJSON = JSON.parse(fs.readFileSync(this.nodePath, 'utf8'));
        return this.nodeArray = nodeJSON.devDependencies ? Object.keys(nodeJSON.devDependencies).map(name => 
            this.createDependency(name.toLowerCase(), nodeJSON.devDependencies[name])
        ) : [];
    }

    getNodeViewProvider() {
        return new NodeViewProvider(this.nodePath);
    }

    getNodeViewAsArray() {
        return this.nodeArray;
    }

    setNodePath(nodePath) {
        this.nodePath = new NodePath(nodePath.getNodeRoot());
        this.getDepedencies();
        return this.nodePath;
    }

    createDependency(name, version) {
        if (NodePath.pathExists(path.join(this.nodeRoot, "node_modules", name))) {
            return new Dependency(name, version);
        }
    }
    
    pathExists(path) {
        try {
            fs.accessSync(path);
            return true;
        } catch (err) {
            return false;
        }
    }

    refresh() {
        this.onChange.fire();
    }

    delete(element) {
        const index = this.nodeArray.findIndex(dep => dep.name === element.name);
        this.nodeArray.splice(index, 1);
        this.refresh();
    }

}

class Dependency extends vscode.TreeItem {
    constructor(name, version) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.name = name;
        this.version = version;
    }
}

module.exports = NodeViewProvider;