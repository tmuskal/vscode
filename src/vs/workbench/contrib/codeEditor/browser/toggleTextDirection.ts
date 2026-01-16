/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from '../../../../base/common/codicons.js';
import { KeyCode, KeyMod } from '../../../../base/common/keyCodes.js';
import { ICodeEditor } from '../../../../editor/browser/editorBrowser.js';
import { EditorAction, ServicesAccessor, registerEditorAction } from '../../../../editor/browser/editorExtensions.js';
import { findDiffEditorContainingCodeEditor } from '../../../../editor/browser/widget/diffEditor/commands.js';
import { EditorOption } from '../../../../editor/common/config/editorOptions.js';
import { localize, localize2 } from '../../../../nls.js';
import { MenuId, MenuRegistry } from '../../../../platform/actions/common/actions.js';
import { ContextKeyExpr } from '../../../../platform/contextkey/common/contextkey.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';

const TOGGLE_TEXT_DIRECTION_ID = 'editor.action.toggleTextDirection';

type ToggleTextDirectionTelemetryEvent = {
	newDirection: 'ltr' | 'rtl';
	surface: 'code' | 'diffOriginal' | 'diffModified';
};

type ToggleTextDirectionTelemetryClassification = {
	owner: 'vscode';
	comment: 'Insights into where text direction toggles occur.';
	newDirection: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'The resulting base text direction after the toggle.' };
	surface: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Indicates whether the toggle happened in a single editor or inside a diff editor (original vs modified).' };
};

class ToggleTextDirectionAction extends EditorAction {

	constructor() {
		super({
			id: TOGGLE_TEXT_DIRECTION_ID,
			label: localize2('toggleTextDirection.label', "View: Toggle Text Direction"),
			alias: 'Toggle Text Direction',
			precondition: undefined,
			kbOpts: {
				kbExpr: null,
				primary: KeyMod.Alt | KeyMod.Shift | KeyCode.KeyR,
				weight: KeybindingWeight.EditorContrib
			}
		});
	}

	public run(accessor: ServicesAccessor, editor: ICodeEditor): void {
		if (!editor.hasModel()) {
			return;
		}

		const telemetryService = accessor.get(ITelemetryService);
		const instantiationService = accessor.get(IInstantiationService);

		const currentDirection = editor.getOption(EditorOption.textDirection);
		const newDirection: 'ltr' | 'rtl' = currentDirection === 'rtl' ? 'ltr' : 'rtl';

		editor.updateOptions({ textDirection: newDirection });

		const diffEditor = instantiationService.invokeFunction(findDiffEditorContainingCodeEditor, editor);
		const surface: ToggleTextDirectionTelemetryEvent['surface'] = diffEditor
			? (diffEditor.getOriginalEditor() === editor ? 'diffOriginal' : 'diffModified')
			: 'code';

		telemetryService.publicLog2<ToggleTextDirectionTelemetryEvent, ToggleTextDirectionTelemetryClassification>('editor.toggleTextDirection', {
			newDirection,
			surface
		});
	}
}

registerEditorAction(ToggleTextDirectionAction);

MenuRegistry.appendMenuItem(MenuId.EditorTitle, {
	command: {
		id: TOGGLE_TEXT_DIRECTION_ID,
		title: localize2('toggleTextDirection.title', "Toggle Text Direction"),
		icon: Codicon.wholeWord,
		tooltip: localize('toggleTextDirection.tooltip', "Switch Text Direction"),
		toggled: ContextKeyExpr.equals('editorTextDirection', 'rtl')
	},
	group: 'navigation',
	order: 1
});

MenuRegistry.appendMenuItem(MenuId.MenubarViewMenu, {
	command: {
		id: TOGGLE_TEXT_DIRECTION_ID,
		title: localize({ key: 'miToggleTextDirection', comment: ['&& denotes a mnemonic'] }, "Switch &&Text Direction"),
		toggled: ContextKeyExpr.equals('editorTextDirection', 'rtl')
	},
	group: '6_editor',
	order: 2
});
