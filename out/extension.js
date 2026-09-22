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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const activatePackageView_1 = require("./activatePackageView");
const activateProjectBox_1 = require("./activateProjectBox");
const activateTermPad_1 = require("./activateTermPad");
const activateHierarchyTree_1 = require("./activateHierarchyTree");
function activate(context) {
    /* ACTIVATIONS */
    (0, activatePackageView_1.activatePackageView)();
    (0, activateProjectBox_1.activateProjectBox)();
    (0, activateTermPad_1.activateTermPad)();
    (0, activateHierarchyTree_1.activateHierarchyTree)();
    /* COMMANDS */
    /**
     * Open Dev Space Settings
     * Keybinding: Ctrl+Alt+S
     * Command: Workbench.Action.Open Settings
     */
    vscode.commands.registerCommand('devspace.openDevSpaceSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:slashdev.devspace');
    });
}
function deactivate() { }
//# sourceMappingURL=extension.js.map