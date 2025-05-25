import * as vscode from 'vscode';
import { activateNodeView } from './activateNodeView';
import { activateProjectBox } from './activateProjectBox';
import { activateTermPad } from './activateTermPad';

export function activate(context?: vscode.ExtensionContext) {
	activateNodeView();
	activateProjectBox();
	activateTermPad();
}

export function deactivate() {}