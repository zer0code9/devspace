"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageStatus = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
class PackageStatus {
    constructor(statusBarItem) {
        this.statusBarItem = statusBarItem;
        this.update();
        this.statusBarItem.show();
    }
    update() {
        const packageRoot = vscode.workspace.getConfiguration('devspace').get('packageRoot');
        const exists = packageRoot ? this.getPackageType(packageRoot) > 0 : false;
        this.statusBarItem.text = exists ? '$(devspace-node-check) Package View' : '$(devspace-node-cross) Package View';
        this.statusBarItem.tooltip = (exists ? `Package Root: ${packageRoot}` : 'Package Root') + " | " + this.getPMCommand(packageRoot);
        this.statusBarItem.command = 'devspace.nodeView.focus';
    }
    getPMCommand(packageRoot) {
        const packageManagers = vscode.workspace.getConfiguration('devspace').get('packageManagers');
        const securedRoot = vscode.workspace.getConfiguration('devspace').get('securedRoot');
        if (this.pathExists(path.join(`${packageRoot}`, 'package.json'))) {
            let packageManager = packageManagers && packageManagers.length > 0 ? packageManagers[0] : "npm";
            return securedRoot ? `sudo ${packageManager}` : packageManager;
        }
        else if (this.pathExists(path.join(`${packageRoot}`, 'pyproject.toml'))) {
            let packageManager = packageManagers && packageManagers.length > 0 ? packageManagers[1] : "pip";
            return securedRoot ? `sudo ${packageManager}` : packageManager;
        }
        else if (this.pathExists(path.join(`${packageRoot}`, 'Cargo.toml'))) {
            let packageManager = "cargo";
            return packageManager;
        }
        if (packageManagers && packageManagers.length > 0) {
            return securedRoot ? `sudo` : `` + packageManagers.join(' - ');
        }
        return "";
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
    getPackageType(packageRoot) {
        if (packageRoot) {
            if (this.pathExists(path.join(`${packageRoot}`, "package.json"))) {
                return 1;
            }
            if (this.pathExists(path.join(`${packageRoot}`, "pyproject.toml"))) {
                return 2;
            }
            if (this.pathExists(path.join(`${packageRoot}`, "Cargo.toml"))) {
                return 3;
            }
        }
        return 0;
    }
}
exports.PackageStatus = PackageStatus;
//# sourceMappingURL=PackageStatus.js.map