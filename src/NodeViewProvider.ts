import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Dependency } from './Dependency';

export class NodeViewProvider implements vscode.TreeDataProvider<Dependency> {
    private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | null | void> = new vscode.EventEmitter<Dependency | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private nodeRoot: string | undefined) {}

    getTreeItem(element: Dependency): vscode.TreeItem {
        return element;
    }
  
    getChildren(element?: Dependency): Thenable<Dependency[]> {
        if (!this.nodeRoot) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }
  
        const nodePath = path.join(this.nodeRoot, 'package.json');
        if (this.pathExists(nodePath)) {
            return Promise.resolve(this.getNodes(nodePath));
        } else {
            vscode.window.showInformationMessage('Workspace has no package.json');
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
  
    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }
        return true;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
  }