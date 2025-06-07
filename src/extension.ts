import * as vscode from 'vscode';
import { activateNodeView } from './activateNodeView';
import { activateProjectBox } from './activateProjectBox';
import { activateTermPad } from './activateTermPad';

export function activate(context?: vscode.ExtensionContext) {
	/* ACTIVATIONS */
	activateNodeView();
	activateProjectBox();
	activateTermPad();

	/* COMMANDS */

	/**
	 * Open Dev Space Settings
	 * Keybinding: Ctrl+Alt+S
	 * Command: Workbench.Action.Open Settings
	 */
	vscode.commands.registerCommand('devspace.openDevSpaceSettings', () => {
		vscode.commands.executeCommand('workbench.action.openSettings', '@ext:slashdev.devspace');
	});
}

export function deactivate() {}