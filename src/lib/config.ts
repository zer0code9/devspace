import { WorkspaceConfiguration, workspace, extensions, Extension, window, DecorationRangeBehavior, TextEditorDecorationType } from 'vscode';

interface Config {
    snippetsLanguages: string[];
    allowSnippets: boolean;
}

function getConfig(): Config {
    const config: WorkspaceConfiguration = workspace.getConfiguration('devspace', window.activeTextEditor?.document);
    const snippetsLanguages = Array.from(new Set(config.get('snippet_langs', [])));

    return {
        snippetsLanguages,
        allowSnippets: config.get('allow_snippets')
    }
}

export { Config, getConfig };