import * as vscode from 'vscode';
import { activateNodeView } from './activateNodeView';
import { activateProjectBox } from './activateProjectBox';

export function activate(context: vscode.ExtensionContext) {
	activateNodeView();
	activateProjectBox();
}

export function deactivate() {}