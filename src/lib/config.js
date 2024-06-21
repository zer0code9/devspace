const vscode = require('vscode');

function getConfig() {
    vscode.window.showInformationMessage("hi");
    const dsconfig = vscode.workspace.getConfiguration();

    //Snippets
    const snippetsLanguages = Array.from(new Set(dsconfig.get('devspace.snippet.languages', [])));
    const allowSnippets = dsconfig.get('devspace.snippet.allow');
    vscode.window.showInformationMessage(allowSnippets + "");

    return {
        snippetsLanguages,
        allowSnippets,
    }
}

module.exports = { getConfig };