import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class NodeViewProvider implements vscode.TreeDataProvider<Dependency> {
    private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | null | void> = new vscode.EventEmitter<Dependency | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | null | void> = this._onDidChangeTreeData.event;

    private nodeRoot: string | undefined;
    private nodePath : string = "";

    constructor() {
        this.update();
    }

    update(): void {
        this.nodeRoot = vscode.workspace.getConfiguration('devspace').get('nodeRoot');
        this.nodePath = this.pathExists(path.join(`${this.nodeRoot}`, "package.json")) ? path.join(`${this.nodeRoot}`, "package.json") : "";
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Dependency): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Dependency): Thenable<Dependency[]> {
        if (this.nodePath && this.pathExists(this.nodePath)) {
            return Promise.resolve(this.getNodes(this.nodePath));
        } else {
            return Promise.resolve([]);
        }
    }

    private getNodes(nodePath: string): Dependency[] {
        if (this.pathExists(nodePath)) {
            const toNode = (name: string, version: string): Dependency => {
                return new Dependency(name, version);
            };
  
            const nodePathJson = JSON.parse(fs.readFileSync(nodePath, 'utf-8'));

            const deps = nodePathJson.dependencies ?
                Object.keys(nodePathJson.dependencies).map(dep =>
                    toNode(dep, nodePathJson.dependencies[dep])
                )
                : [];
            const devDeps = nodePathJson.devDependencies ?
                Object.keys(nodePathJson.devDependencies).map(dep =>
                    toNode(dep, nodePathJson.devDependencies[dep])
                )
                : [];
            return deps.concat(devDeps);
        } else {
            return [];
        }
    }
  
    private pathExists(path: string): boolean {
        try {
            fs.accessSync(path);
        } catch (err) {
            return false;
        }
        return true;
    }
}

export class Dependency extends vscode.TreeItem {
    constructor(public readonly name: string, private version: string) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `${this.name} ${this.version}`;
        this.description = this.version;
        this.contextValue = 'node';
    }
}