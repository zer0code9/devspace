import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class NodePath {
    nodeRoot: string;
    nodePath: string;

    constructor(nodeRoot: string) {
        this.nodeRoot = nodeRoot;
        this.nodePath = this.setNodeRoot(nodeRoot) ? this.getNodePathAsString() : this.getInitialNodePath() ? this.getInitialNodePath() : "";
    }

    getInitialNodePath(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {return "";}
        const arrayNodeRoot: vscode.WorkspaceFolder = workspaceFolders[0];
        const initialNodeRoot = arrayNodeRoot ? arrayNodeRoot.uri.fsPath : "";
        const initialNodePath = initialNodeRoot ? this.makeNodePath(initialNodeRoot) : "";
        return this.checkNodePath(initialNodePath) ? initialNodePath : "";
    }

    getNodePath(): NodePath {
        return new NodePath(this.nodeRoot);
    }

    getNodePathAsString(): string {
        return this.nodePath;
    }

    getNodeRoot(): string {
        return this.nodeRoot;
    }

    setNodeRoot(nodeRoot: string): string {
        this.nodeRoot = this.checkPath(nodeRoot) ? nodeRoot : "";
        this.nodePath = this.checkNodePath(this.makeNodePath(nodeRoot)) ? this.makeNodePath(nodeRoot) : "";
        return this.nodePath;
    }

    checkNodePath(nodePath: string): string {
        return this.checkPath(nodePath) ? this.nodePath : "null";
    }

    makeNodePath(nodeRoot: string): string {
        return path.join(nodeRoot, "package.json");
    }

    checkPath(path: string): boolean {
        try {
            fs.accessSync(path);
            return true;
        } catch (err) {
            return false;
        }
    }
}