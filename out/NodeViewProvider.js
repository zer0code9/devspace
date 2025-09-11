"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dependency = exports.NodeViewProvider = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const axios_1 = require("axios");
const cheerio = require("cheerio");
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
        if (this.nodePath && this.pathExists(this.nodePath)) {
            return Promise.resolve(this.getNodes(this.nodePath));
        }
        else {
            return Promise.resolve([]);
        }
    }
    async getNodes(nodePath) {
        if (this.pathExists(nodePath)) {
            const toDep = (name, version) => {
                return new Dependency(name, version);
            };
            const nodePathJson = JSON.parse(fs.readFileSync(nodePath, 'utf-8'));
            const prodDeps = nodePathJson.dependencies ?
                Object.keys(nodePathJson.dependencies).map(dep => toDep(dep, nodePathJson.dependencies[dep]))
                : [];
            const devDeps = nodePathJson.devDependencies ?
                Object.keys(nodePathJson.devDependencies).map(dep => toDep(dep, nodePathJson.devDependencies[dep]))
                : [];
            const dependencies = prodDeps.concat(devDeps);
            const initPromises = dependencies.map(dep => dep.waitForInitialization());
            await Promise.all(initPromises);
            return dependencies;
        }
        else {
            return [];
        }
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
    constructor(name, version) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.name = name;
        this.version = version;
        this.description = this.version;
        this.initializeDescription();
        this.tooltip = `${this.name} ${this.version}`;
        this.contextValue = 'depnode';
        this.initializationPromise = this.initializeDescription();
    }
    async waitForInitialization() {
        await this.initializationPromise;
    }
    async initializeDescription() {
        const actualVersion = await this.isNewVersionAvailable(this.name, this.version);
        if (actualVersion !== "") {
            this.description = `${this.version} -> ^${actualVersion}`;
        }
        else {
            this.description = this.version;
        }
    }
    async isNewVersionAvailable(name, version) {
        const response = await axios_1.default.get(`https://www.npmjs.com/package/${name}?activeTab=versions`);
        const $ = cheerio.load(response.data);
        const $table = $('table[aria-labelledby="current-tags"]').find('tbody tr');
        const actualVersion = $table.find('td').find('a').eq(0).text().trim();
        if ("^" + actualVersion !== version) {
            return actualVersion;
        }
        return "";
    }
}
exports.Dependency = Dependency;
//# sourceMappingURL=NodeViewProvider.js.map