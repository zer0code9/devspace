"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Package = exports.PackageViewProvider = void 0;
const fs = require("fs");
const path = require("path");
const axios_1 = require("axios");
const smol_toml_1 = require("smol-toml");
const vscode = require("vscode");
class PackageViewProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.nodePath = "";
        this.pipPath = "";
        this.cratePath = "";
        this.update();
    }
    update() {
        this.packageRoot = vscode.workspace.getConfiguration('devspace').get('packageRoot');
        this.nodePath = this.pathExists(path.join(`${this.packageRoot}`, "package.json")) ? path.join(`${this.packageRoot}`, "package.json") : "";
        this.pipPath = this.pathExists(path.join(`${this.packageRoot}`, "pyproject.toml")) ? path.join(`${this.packageRoot}`, "pyproject.toml") : "";
        this.cratePath = this.pathExists(path.join(`${this.packageRoot}`, "Cargo.toml")) ? path.join(`${this.packageRoot}`, "Cargo.toml") : "";
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!vscode.workspace.getConfiguration('devspace').get('showSections')) {
            let managerType = "";
            if (this.nodePath && this.pathExists(this.nodePath)) {
                managerType = "node";
            }
            else if (this.pipPath && this.pathExists(this.pipPath)) {
                managerType = "pip";
            }
            else if (this.cratePath && this.pathExists(this.cratePath)) {
                managerType = "crate";
            }
            return Promise.resolve(this.getPackages(`${managerType}-all`));
        }
        if (element) {
            return Promise.resolve(this.getPackages(element.info));
        }
        return Promise.resolve(this.getSections());
    }
    async getSections() {
        const toSection = (name, count, info) => {
            return new Package(name, `${count || 0}`, info, count === 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.Expanded, "sectionItem");
        };
        let managerType = "";
        if (this.nodePath && this.pathExists(this.nodePath)) {
            managerType = "node";
        }
        else if (this.pipPath && this.pathExists(this.pipPath)) {
            managerType = "pip";
        }
        else if (this.cratePath && this.pathExists(this.cratePath)) {
            managerType = "crate";
        }
        const packages = await this.getPackages(`${managerType}-all`, false);
        const sections = [
            toSection("production", packages.filter(pkg => pkg.depType === "prod").length, `${managerType}-prod`),
            toSection("development", packages.filter(pkg => pkg.depType === "dev").length, `${managerType}-dev`),
        ];
        if (packages.filter(pkg => pkg.depType === "prod").length === 0) {
            sections.shift();
        }
        if (packages.filter(pkg => pkg.depType === "dev").length === 0) {
            sections.pop();
        }
        return sections;
    }
    async getPackages(info, allowInitialization = true) {
        const [managerType, depType] = info.split('-');
        let packages = [];
        if (managerType === "node") {
            packages = await this.getNodes(this.nodePath, allowInitialization);
        }
        else if (managerType === "pip") {
            packages = await this.getPips(this.pipPath, allowInitialization);
        }
        else if (managerType === "crate") {
            packages = await this.getCrates(this.cratePath, allowInitialization);
        }
        if (depType === "all") {
            return packages;
        }
        return packages.filter(pkg => pkg.info === info);
    }
    async getNodes(nodePath, allowInitialization = true) {
        if (!this.pathExists(nodePath)) {
            return [];
        }
        const toPackage = (name, version, depType) => {
            return new Package(name, version, `node-${depType}`, vscode.TreeItemCollapsibleState.None, "packageItem");
        };
        const nodePathJson = JSON.parse(fs.readFileSync(nodePath, 'utf-8'));
        const prodPackageItems = nodePathJson.dependencies
            ? Object.keys(nodePathJson.dependencies).map(dep => toPackage(dep, nodePathJson.dependencies[dep], "prod"))
            : [];
        const devPackageItems = nodePathJson.devDependencies
            ? Object.keys(nodePathJson.devDependencies).map(dep => toPackage(dep, nodePathJson.devDependencies[dep], "dev"))
            : [];
        const packageItems = prodPackageItems.concat(devPackageItems);
        if (vscode.workspace.getConfiguration('devspace').get('showNewVersions') && allowInitialization) {
            const initPromises = packageItems.map(dep => dep.waitForInitialization());
            await Promise.all(initPromises);
        }
        return packageItems;
    }
    async getPips(pipPath, allowInitialization = true) {
        if (!this.pathExists(pipPath)) {
            return [];
        }
        const toPackage = (name, version, depType) => {
            return new Package(name, version, `pip-${depType}`, vscode.TreeItemCollapsibleState.None, "packageItem");
        };
        const pipPathParse = (0, smol_toml_1.parse)(fs.readFileSync(pipPath, 'utf-8'));
        const regex = /^(.+?)\s*(>=|==|<=)\s*(.+)$/;
        const prodPackageItems = pipPathParse.project?.dependencies
            ? Object.entries(pipPathParse.project?.dependencies).map((entry) => entry[1]).map(dep => toPackage(dep.match(regex)[1], dep.match(regex)[3], "prod"))
            : [];
        const devPackageItems = pipPathParse.project["optional-dependencies"].dev
            ? Object.entries(pipPathParse.project["optional-dependencies"].dev).map((entry) => entry[1]).map(dep => toPackage(dep.match(regex)[1], dep.match(regex)[3], "dev"))
            : [];
        const packageItems = prodPackageItems.concat(devPackageItems);
        if (vscode.workspace.getConfiguration('devspace').get('showNewVersions') && allowInitialization) {
            const initPromises = packageItems.map(dep => dep.waitForInitialization());
            await Promise.all(initPromises);
        }
        return packageItems;
    }
    async getCrates(cratePath, allowInitialization = true) {
        if (!this.pathExists(cratePath)) {
            return [];
        }
        const toPackage = (name, version, depType) => {
            return new Package(name, version, `crate-${depType}`, vscode.TreeItemCollapsibleState.None, "packageItem");
        };
        const cratePathParse = (0, smol_toml_1.parse)(fs.readFileSync(cratePath, 'utf-8'));
        const prodPackageItems = cratePathParse.dependencies
            ? Object.entries(cratePathParse.dependencies).map(([name, version]) => toPackage(name, version, "prod"))
            : [];
        const devPackageItems = cratePathParse["dev-dependencies"]
            ? Object.entries(cratePathParse["dev-dependencies"]).map(([name, version]) => toPackage(name, version, "dev"))
            : [];
        const packageItems = prodPackageItems.concat(devPackageItems);
        if (vscode.workspace.getConfiguration('devspace').get('showNewVersions') && allowInitialization) {
            const initPromises = packageItems.map(dep => dep.waitForInitialization());
            await Promise.all(initPromises);
        }
        return packageItems;
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
exports.PackageViewProvider = PackageViewProvider;
class Package extends vscode.TreeItem {
    constructor(name, version, info, collapsibleState, context) {
        super(name, collapsibleState);
        this.name = name;
        this.version = version;
        this.info = info;
        this.collapsibleState = collapsibleState;
        this.context = context;
        this.managerType = "";
        this.depType = "";
        this.description = this.version;
        this.tooltip = `${this.name} ${this.version}`;
        this.contextValue = this.context;
        [this.managerType, this.depType] = this.info.split('-');
        this.initializationPromise = this.initializeDescription();
    }
    async waitForInitialization() {
        await this.initializationPromise;
    }
    async initializeDescription() {
        const actualVersion = await this.isNewVersionAvailable(this.name, this.version);
        if (actualVersion !== "") {
            this.description = `${this.version} -> ${actualVersion}`;
        }
    }
    async isNewVersionAvailable(name, version) {
        if (this.managerType === "node") {
            try {
                const response = await axios_1.default.get(`https://registry.npmjs.org/${name}`);
                const latestVersion = response.data["dist-tags"]?.latest;
                if (latestVersion && ("^" + latestVersion !== version)) {
                    return "^" + latestVersion;
                }
            }
            catch (err) {
                return "";
            }
            return "";
        }
        else if (this.managerType === "pip") {
            try {
                const response = await axios_1.default.get(`https://pypi.org/pypi/${name}/json`);
                const latestVersion = response.data.info?.version;
                if (latestVersion && (latestVersion !== version)) {
                    return latestVersion;
                }
            }
            catch (err) {
                return "";
            }
            return "";
        }
        else if (this.managerType === "crate") {
            try {
                const response = await axios_1.default.get(`https://crates.io/api/v1/crates/${name}`);
                const latestVersion = response.data.crate?.max_stable_version;
                if (latestVersion && (latestVersion !== version)) {
                    return latestVersion;
                }
            }
            catch (err) {
                return "";
            }
            return "";
        }
        return "";
    }
}
exports.Package = Package;
//# sourceMappingURL=PackageViewProvider.js.map