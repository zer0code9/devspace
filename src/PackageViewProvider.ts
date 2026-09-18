import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { parse } from 'smol-toml';
import * as vscode from 'vscode';

export class PackageViewProvider implements vscode.TreeDataProvider<Package> {
    private _onDidChangeTreeData: vscode.EventEmitter<Package | undefined | null | void> = new vscode.EventEmitter<Package | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<Package | undefined | null | void> = this._onDidChangeTreeData.event;

    private packageRoot: string | undefined;
    private nodePath : string = "";
    private pipPath : string = "";
    private cratePath : string = "";

    constructor() {
        this.update();
    }

    update(): void {
        this.packageRoot = vscode.workspace.getConfiguration('devspace').get('packageRoot');
        this.nodePath = this.pathExists(path.join(`${this.packageRoot}`, "package.json")) ? path.join(`${this.packageRoot}`, "package.json") : "";
        this.pipPath = this.pathExists(path.join(`${this.packageRoot}`, "pyproject.toml")) ? path.join(`${this.packageRoot}`, "pyproject.toml") : "";
        this.cratePath = this.pathExists(path.join(`${this.packageRoot}`, "Cargo.toml")) ? path.join(`${this.packageRoot}`, "Cargo.toml") : "";
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Package): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Package): Thenable<Package[]> {
        if (!vscode.workspace.getConfiguration('devspace').get('showSections')) {
            let managerType: string = "";
            if (this.nodePath && this.pathExists(this.nodePath)) { managerType = "node"; }
            else if (this.pipPath && this.pathExists(this.pipPath)) { managerType = "pip"; }
            else if (this.cratePath && this.pathExists(this.cratePath)) { managerType = "crate"; }
            return Promise.resolve(this.getPackages(`${managerType}-all`));
        }

        if (element) { return Promise.resolve(this.getPackages(element.info)); }
        return Promise.resolve(this.getSections());
    }

    async getSections(): Promise<Package[]> {
        const toSection = (name: string, count: number, info: string): Package => {
            return new Package(name, `${count || 0}`, info, count === 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.Expanded, "sectionItem");
        }

        let managerType: string = "";
        if (this.nodePath && this.pathExists(this.nodePath)) { managerType = "node"; }
        else if (this.pipPath && this.pathExists(this.pipPath)) { managerType = "pip"; }
        else if (this.cratePath && this.pathExists(this.cratePath)) { managerType = "crate"; }

        const packages = await this.getPackages(`${managerType}-all`, false);
        const sections: Package[] = [
            toSection("production", packages.filter(pkg => pkg.depType === "prod").length, `${managerType}-prod`),
            toSection("development", packages.filter(pkg => pkg.depType === "dev").length, `${managerType}-dev`),
        ];
        if (packages.filter(pkg => pkg.depType === "prod").length === 0) { sections.shift(); }
        if (packages.filter(pkg => pkg.depType === "dev").length === 0) { sections.pop(); }
        return sections;
    }

    async getPackages(info: string, allowInitialization: boolean = true): Promise<Package[]> {
        const [managerType, depType] = info.split('-');
        let packages: Package[] = [];
        if (managerType === "node") { packages = await this.getNodes(this.nodePath, allowInitialization); }
        else if (managerType === "pip") { packages = await this.getPips(this.pipPath, allowInitialization); }
        else if (managerType === "crate") { packages = await this.getCrates(this.cratePath, allowInitialization); }

        if (depType === "all") { return packages; }

        return packages.filter(pkg => pkg.info === info);
    }

    async getNodes(nodePath: string, allowInitialization: boolean = true): Promise<Package[]> {
        if (!this.pathExists(nodePath)) { return []; }
        const toPackage = (name: string, version: string, depType: string): Package => {
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

    async getPips(pipPath: string, allowInitialization: boolean = true): Promise<Package[]> {
        if (!this.pathExists(pipPath)) { return []; }
        const toPackage = (name: string, version: string, depType: string): Package => {
            return new Package(name, version, `pip-${depType}`, vscode.TreeItemCollapsibleState.None, "packageItem");
        };

        const pipPathParse = parse(fs.readFileSync(pipPath, 'utf-8')) as Record<string, any>;

        const regex = /^(.+?)\s*(>=|==|<=)\s*(.+)$/;
        const prodPackageItems = pipPathParse.project?.dependencies as string[] | undefined
            ? Object.entries(pipPathParse.project?.dependencies).map((entry) => entry[1]).map(dep => toPackage((dep as string).match(regex)![1], (dep as string).match(regex)![3], "prod"))
            : [];
        const devPackageItems = pipPathParse.project["optional-dependencies"].dev as string[] | undefined
            ? Object.entries(pipPathParse.project["optional-dependencies"].dev).map((entry) => entry[1]).map(dep => toPackage((dep as string).match(regex)![1], (dep as string).match(regex)![3], "dev"))
            : [];
        const packageItems = prodPackageItems.concat(devPackageItems);
        if (vscode.workspace.getConfiguration('devspace').get('showNewVersions') && allowInitialization) {
            const initPromises = packageItems.map(dep => dep.waitForInitialization());
            await Promise.all(initPromises);
        }
        return packageItems;
    }

    async getCrates(cratePath: string, allowInitialization: boolean = true): Promise<Package[]> {
        if (!this.pathExists(cratePath)) { return []; }
        const toPackage = (name: string, version: string, depType: string): Package => {
            return new Package(name, version, `crate-${depType}`, vscode.TreeItemCollapsibleState.None, "packageItem");
        };

        const cratePathParse = parse(fs.readFileSync(cratePath, 'utf-8'));

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
  
    pathExists(path: string): boolean {
        try {
            fs.accessSync(path);
        } catch (err) {
            return false;
        }
        return true;
    }
}

export class Package extends vscode.TreeItem {
    private initializationPromise: Promise<void>;
    public readonly managerType: string = "";
    public readonly depType: string = "";

    constructor(public readonly name: string, public readonly version: string, public readonly info: string, public readonly collapsibleState: vscode.TreeItemCollapsibleState, public readonly context: string) {
        super(name, collapsibleState);
        this.description = this.version;
        this.tooltip = `${this.name} ${this.version}`;
        this.contextValue = this.context;
        [this.managerType, this.depType] = this.info.split('-');
        this.initializationPromise = this.initializeDescription();
    }

    async waitForInitialization(): Promise<void> {
        await this.initializationPromise;
    }

    private async initializeDescription() {
        const actualVersion = await this.isNewVersionAvailable(this.name, this.version);
        if (actualVersion !== "") { this.description = `${this.version} -> ${actualVersion}`; }
    }

    private async isNewVersionAvailable(name: string, version: string): Promise<string> {
        if (this.managerType === "node") {
            try {
                const response = await axios.get(`https://registry.npmjs.org/${name}`);
                const latestVersion = response.data["dist-tags"]?.latest;
                if (latestVersion && ("^" + latestVersion !== version)) { return "^" + latestVersion; }
            } catch (err) {
                return "";
            }
            return "";
        } else if (this.managerType === "pip") {
            try {
                const response = await axios.get(`https://pypi.org/pypi/${name}/json`);
                const latestVersion = response.data.info?.version;
                if (latestVersion && (latestVersion !== version)) { return latestVersion; }
            } catch (err) {
                return "";
            }
            return "";
        } else if (this.managerType === "crate") {
            try {
                const response = await axios.get(`https://crates.io/api/v1/crates/${name}`);
                const latestVersion = response.data.crate?.max_stable_version;
                if (latestVersion && (latestVersion !== version)) { return latestVersion; }
            } catch (err) {
                return "";
            }
            return "";
        }
        return "";
    }
}