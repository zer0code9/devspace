const vscode = require('vscode');

const config = {
    snippetsLanguages,
    allowSnippets,
}

function getConfig() {
    const config = vscode.workspace.getConfiguration('devspace');
    const snippetsLanguages = Array.from(new Set(config.get('snippet.languages', [])));

    return {
        snippetsLanguages,
        allowSnippets: config.get('snippet.allow'),
    }
}

export { config, getConfig };