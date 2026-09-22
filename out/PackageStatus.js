"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageStatus = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
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