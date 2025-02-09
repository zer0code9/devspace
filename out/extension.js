"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const activateNodeView_1 = require("./activateNodeView");
const activateProjectBox_1 = require("./activateProjectBox");
function activate(context) {
    (0, activateNodeView_1.activateNodeView)();
    (0, activateProjectBox_1.activateProjectBox)();
}
function deactivate() { }
//# sourceMappingURL=extension.js.map