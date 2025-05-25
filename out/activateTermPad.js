"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateTermPad = activateTermPad;
const vscode = require("vscode");
const TermPadProvider_1 = require("./TermPadProvider");
function activateTermPad() {
    const termPadProvider = new TermPadProvider_1.TermPadProvider();
    vscode.window.registerTreeDataProvider('devspace.termPad', termPadProvider);
    termPadProvider.refresh();
    vscode.commands.registerCommand('devspace.refreshTermPad', () => {
        termPadProvider.refresh();
    });
}
//# sourceMappingURL=activateTermPad.js.map