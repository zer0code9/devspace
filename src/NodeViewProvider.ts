import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

    async getNodes(nodePath: string): Promise<Dependency[]> {
        if (this.pathExists(nodePath)) {
            const toDep = (name: string, version: string): Dependency => {
                return new Dependency(name, version);
            };
  
            const nodePathJson = JSON.parse(fs.readFileSync(nodePath, 'utf-8'));

            const prodDeps = nodePathJson.dependencies ?
                Object.keys(nodePathJson.dependencies).map(dep =>
                    toDep(dep, nodePathJson.dependencies[dep])
                )
                : [];
            const devDeps = nodePathJson.devDependencies ?
                Object.keys(nodePathJson.devDependencies).map(dep =>
                    toDep(dep, nodePathJson.devDependencies[dep])
                )
                : [];
            const dependencies = prodDeps.concat(devDeps);
            if (vscode.workspace.getConfiguration('devspace').get('showNewVersions')) {
                const initPromises = dependencies.map(dep => dep.waitForInitialization());
                await Promise.all(initPromises);
            }
            return dependencies;
        } else {
            return [];
        }
    }
  
    pathExists(path: string): boolean {
        try {
            fs.accessSync(path);
        } catch (err) {
            return false;
        }
        return true;
    }
}

export class Dependency extends vscode.TreeItem {
    private initializationPromise: Promise<void>;
    //private static versionCache: Map<string, string> = new Map();
    constructor(public readonly name: string, public readonly version: string) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.description = this.version;
        this.tooltip = `${this.name} ${this.version}`;
        this.contextValue = 'depnode';
        this.initializationPromise = this.initializeDescription();
    }

    async waitForInitialization(): Promise<void> {
        await this.initializationPromise;
    }

    private async initializeDescription() {
        const actualVersion = await this.isNewVersionAvailable(this.name, this.version);
        if (actualVersion !== "") {
            this.description = `${this.version} -> ^${actualVersion}`;
        }
    }

    private async isNewVersionAvailable(name: string, version: string): Promise<string> {
        let retries = 0;
        let delay = 500;
        while (retries < 3) {
            try {
                const response = await axios.get(`https://registry.npmjs.org/${name}`);
                const latestVersion = response.data["dist-tags"]?.latest;
                if (latestVersion && ("^" + latestVersion !== version)) {
                    return latestVersion;
                }
                break;
            } catch (err: any) {
                if (err.response && err.response.status === 429) {
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2;
                    retries++;
                } else {
                    break;
                }
            }
        }
        return "";
    }
}