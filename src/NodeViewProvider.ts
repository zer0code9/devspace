import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Dependency } from './Dependency';

export class NodeViewProvider implements vscode.TreeDataProvider<Dependency> {
    private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | null | void> = new vscode.EventEmitter<Dependency | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | null | void> = this._onDidChangeTreeData.event;

    private nodeRoot: string | undefined;
    private nodePath: string;

    constructor(nodeRoot: string | undefined) {
        this.nodeRoot = nodeRoot;
        this.nodePath = "";
        this.makeNodePath();
    }

    getTreeItem(element: Dependency): vscode.TreeItem {
        return element;
    }
  
    getChildren(element?: Dependency): Thenable<Dependency[]> {
        if (!this.nodeRoot) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }

        if (this.pathExists(this.nodePath)) {
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

            const deps = nodePathJson.dependencies
            ? Object.keys(nodePathJson.dependencies).map(dep =>
                toNode(dep, nodePathJson.dependencies[dep])
              )
            : [];
          const devDeps = nodePathJson.devDependencies
            ? Object.keys(nodePathJson.devDependencies).map(dep =>
                toNode(dep, nodePathJson.devDependencies[dep])
              )
            : [];
          return deps.concat(devDeps);
        } else {
            return [];
        }
    }

    setNodeRoot(nodeRoot: string | undefined): string {
        this.nodeRoot = nodeRoot;
        this.makeNodePath();
        return this.nodePath;
    }

    private makeNodePath() {
        this.nodePath = this.pathExists(path.join(`${this.nodeRoot}`, "package.json")) ? path.join(`${this.nodeRoot}`, "package.json") : "";
    }
  
    private pathExists(path: string): boolean {
        try {
            fs.accessSync(path);
        } catch (err) {
            return false;
        }
        return true;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }


  }