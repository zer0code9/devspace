const vscode = require('vscode');

const config = {
    snippetsLanguages,
    allowSnippets
}

function getConfig() {
    const config = vscode.workspace.getConfiguration('devspace', vscode.window.activeTextEditor?.document);
    const snippetsLanguages = Array.from(new Set(config.get('snippet_langs', [])));

    return {
        snippetsLanguages,
        allowSnippets: config.get('allow_snippets')
    }
}

export { config, getConfig };