import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class PackageStatus {
    constructor(private statusBarItem: vscode.StatusBarItem) {
        this.update();
        this.statusBarItem.show();
    }

    update(): void {
        const packageRoot: string | undefined = vscode.workspace.getConfiguration('devspace').get('packageRoot');
        const exists: boolean = packageRoot ? this.getPackageType(packageRoot) > 0 : false;
        this.statusBarItem.text = exists ? '$(devspace-node-check) Package View' : '$(devspace-node-cross) Package View';
        this.statusBarItem.tooltip = (exists ? `Package Root: ${packageRoot}` : 'Package Root') + " | " + this.getPMCommand(packageRoot);
        this.statusBarItem.command = 'devspace.nodeView.focus';
    }

    getPMCommand(packageRoot?: string): string {
        const packageManagers: string[] | undefined = vscode.workspace.getConfiguration('devspace').get('packageManagers');
        const securedRoot: boolean | undefined = vscode.workspace.getConfiguration('devspace').get('securedRoot');
        if (this.pathExists(path.join(`${packageRoot}`, 'package.json'))) {
            let packageManager = packageManagers && packageManagers.length > 0 ? packageManagers[0] : "npm";
            return securedRoot ? `sudo ${packageManager}` : packageManager;
        } else if (this.pathExists(path.join(`${packageRoot}`, 'pyproject.toml'))) {
            let packageManager = packageManagers && packageManagers.length > 0 ? packageManagers[1] : "pip";
            return securedRoot ? `sudo ${packageManager}` : packageManager;
        } else if (this.pathExists(path.join(`${packageRoot}`, 'Cargo.toml'))) {
            let packageManager = "cargo";
            return packageManager;
        }
        if (packageManagers && packageManagers.length > 0) {
            return securedRoot ? `sudo` : `` + packageManagers.join(' - ');
        }
        return "";
    }

    pathExists(path: string): boolean {
        try {
            fs.accessSync(path);
        } catch (err) {
            return false;
        }
        return true;
    }

    getPackageType(packageRoot?: string): number {
        if (packageRoot) {
            if (this.pathExists(path.join(`${packageRoot}`, "package.json"))) { return 1; }
            if (this.pathExists(path.join(`${packageRoot}`, "pyproject.toml"))) { return 2; }
            if (this.pathExists(path.join(`${packageRoot}`, "Cargo.toml"))) { return 3; }
        }
        return 0;
    }
}