"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const activateNodeView_1 = require("./activateNodeView");
const activateProjectBox_1 = require("./activateProjectBox");
const activateTermPad_1 = require("./activateTermPad");
const activateBreakdown_1 = require("./activateBreakdown");
function activate(context) {
    (0, activateNodeView_1.activateNodeView)();
    (0, activateProjectBox_1.activateProjectBox)();
    (0, activateTermPad_1.activateTermPad)();
    (0, activateBreakdown_1.activateBreakdown)(context);
}
/**
 * TODO: Add Extension Deactivation
 * FIXME: Extension Deactivation
 */
function deactivate() { }
//# sourceMappingURL=extension.js.map