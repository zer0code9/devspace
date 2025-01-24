"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeStatus = void 0;
const fs = require("fs");
const path = require("path");
class NodeStatus {
    constructor(statusBarItem, nodeRoot) {
        this.statusBarItem = statusBarItem;
        this.update(nodeRoot);
        this.statusBarItem.show();
    }
    update(nodeRoot) {
        const exists = this.pathExists(path.join(`${nodeRoot}`, 'package.json'));
        this.statusBarItem.text = exists ? '$(check) Node View' : '$(cross) Node View';
        this.statusBarItem.tooltip = exists ? `Node Root: ${nodeRoot}` : 'No Node Root';
    }
    getStatusBarItem() {
        return this.statusBarItem;
    }
    pathExists(p) {
        try {
            fs.accessSync(p);
        }
        catch (err) {
            return false;
        }
        return true;
    }
}
exports.NodeStatus = NodeStatus;
//# sourceMappingURL=NodeStatus.js.map