const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	vscode.window.showInformationMessage('Hello from devspace!');
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}