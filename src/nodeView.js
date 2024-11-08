import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

class NodeView {
    constructor(nodeRoot) {
        this.nodeRoot = nodeRoot;
        this.getDepedencies(path.join(this.nodeRoot, "package.json"));
        this.onChange = new vscode.EventEmitter();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!this.nodeRoot) return Promise.resolve([]);

        const packagePath = path.join(this.nodeRoot, "package.json");
        if (!this.pathExists(packagePath)) return Promise.resolve([]);

        return Promise.resolve(this.getDepedencies(packagePath));
    }

    onDidChangeTreeData() {
        return this.onChange.event;
    }

    getDepedencies(packagePath) {
        if (!this.pathExists(packagePath)) return [];
    
        const packageJSON = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
        this.nodeArray = packageJSON.devDependencies ? Object.keys(packageJSON.devDependencies).map(name => 
            this.createDependency(name.toLowerCase(), packageJSON.devDependencies[name])
        ) : [];

        return this.nodeArray;
    }

    createDependency(name, version) {
        if (this.pathExists(path.join(this.nodeRoot, "node_modules", name))) {
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

module.exports = NodeView;