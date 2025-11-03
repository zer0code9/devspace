"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dependency = exports.NodeViewProvider = void 0;
const fs = require("fs");
const path = require("path");
const axios_1 = require("axios");
const vscode = require("vscode");
class NodeViewProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.nodePath = "";
        this.update();
    }
    update() {
        this.nodeRoot = vscode.workspace.getConfiguration('devspace').get('nodeRoot');
        this.nodePath = this.pathExists(path.join(`${this.nodeRoot}`, "package.json")) ? path.join(`${this.nodeRoot}`, "package.json") : "";
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (this.nodePath && this.pathExists(this.nodePath))
            return Promise.resolve(this.getNodes(this.nodePath));
        return Promise.resolve([]);
    }
    async getNodes(nodePath) {
        if (!this.pathExists(nodePath))
            return [];
        const toDep = (name, version) => {
            return new Dependency(name, version);
        };
        const nodePathJson = JSON.parse(fs.readFileSync(nodePath, 'utf-8'));
        const prodDeps = nodePathJson.dependencies
            ? Object.keys(nodePathJson.dependencies).map(dep => toDep(dep, nodePathJson.dependencies[dep]))
            : [];
        const devDeps = nodePathJson.devDependencies
            ? Object.keys(nodePathJson.devDependencies).map(dep => toDep(dep, nodePathJson.devDependencies[dep]))
            : [];
        const dependencies = prodDeps.concat(devDeps);
        if (vscode.workspace.getConfiguration('devspace').get('showNewVersions')) {
            const initPromises = dependencies.map(dep => dep.waitForInitialization());
            await Promise.all(initPromises);
        }
        return dependencies;
    }
    pathExists(path) {
        try {
            fs.accessSync(path);
        }
        catch (err) {
            return false;
        }
        return true;
    }
}
exports.NodeViewProvider = NodeViewProvider;
class Dependency extends vscode.TreeItem {
    //private static versionCache: Map<string, string> = new Map();
    constructor(name, version) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.name = name;
        this.version = version;
        this.description = this.version;
        this.tooltip = `${this.name} ${this.version}`;
        this.contextValue = 'depnode';
        this.initializationPromise = this.initializeDescription();
    }
    async waitForInitialization() {
        await this.initializationPromise;
    }
    async initializeDescription() {
        const actualVersion = await this.isNewVersionAvailable(this.name, this.version);
        if (actualVersion !== "")
            this.description = `${this.version} -> ^${actualVersion}`;
    }
    async isNewVersionAvailable(name, version) {
        let retries = 0;
        let delay = 500;
        while (retries < 3)
            try {
                const response = await axios_1.default.get(`https://registry.npmjs.org/${name}`);
                const latestVersion = response.data["dist-tags"]?.latest;
                if (latestVersion && ("^" + latestVersion !== version))
                    return latestVersion;
                break;
            }
            catch (err) {
                if (err.response && err.response.status === 429) {
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2;
                    retries++;
                }
                else
                    break;
            }
        return "";
    }
}
exports.Dependency = Dependency;
//# sourceMappingURL=NodeViewProvider.js.map