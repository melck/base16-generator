"use strict";
import * as vscode from "vscode";
import { getThemeItems, promptRestart, readExistingThemes, writeActivatedThemes } from "./utils";

export function activate(context: vscode.ExtensionContext): void {
  const disposables: vscode.Disposable[] = [
    vscode.commands.registerCommand("base16.generator.activateTheme", () => activateTheme()),
    vscode.commands.registerCommand("base16.generator.deactivateTheme", () => deactivateTheme()),
    vscode.commands.registerCommand("base16.generator.activateAllThemes", () => activateAllThemes()),
    vscode.commands.registerCommand("base16.generator.deactivateAllThemes", () => deactivateAllThemes()),
    vscode.workspace.onDidChangeConfiguration((e) => onDidChangeConfiguration(e)),
  ];

  for (const disposable of disposables) {
    context.subscriptions.push(disposable);
  }

  // If reinstalling or updating, it will load themes in settings
  applyChanges();
}

async function activateTheme() {
  let configThemes = vscode.workspace.getConfiguration().get("base16.generator.activatedThemes") as string[];
  const themeItems = getThemeItems(configThemes);

  const selectedThemes = await vscode.window.showQuickPick(themeItems, {
    ignoreFocusOut: false,
    matchOnDescription: false,
    matchOnDetail: false,
    placeHolder: "Search a theme",
    canPickMany: true,
  });

  if (!selectedThemes) {
    return;
  }

  configThemes = selectedThemes.map((t) => t.description) as string[];
  await vscode.workspace.getConfiguration().update("base16.generator.activatedThemes", configThemes, true);
}

async function deactivateTheme() {
  let configThemes = vscode.workspace.getConfiguration().get("base16.generator.activatedThemes") as string[];
  const themeItems = getThemeItems(configThemes, true);

  const selectedThemes = await vscode.window.showQuickPick(themeItems, {
    ignoreFocusOut: false,
    matchOnDescription: false,
    matchOnDetail: false,
    placeHolder: "Search a theme",
    canPickMany: true,
  });

  if (!selectedThemes) {
    return;
  }

  configThemes = selectedThemes.map((t) => t.description) as string[];

  const target = vscode.ConfigurationTarget.Global;
  await vscode.workspace.getConfiguration().update("base16.generator.activatedThemes", configThemes, target);
}

async function activateAllThemes() {
  const target = vscode.ConfigurationTarget.Global;
  await vscode.workspace.getConfiguration().update("base16.generator.activatedThemes", readExistingThemes(), target);
}

async function deactivateAllThemes() {
  const target = vscode.ConfigurationTarget.Global;
  await vscode.workspace.getConfiguration().update("base16.generator.activatedThemes", [], target);
}

async function onDidChangeConfiguration(e: vscode.ConfigurationChangeEvent) {
  if (e.affectsConfiguration("base16.generator.activatedThemes")) {
    applyChanges();
  }
}

async function applyChanges() {
  const themes = vscode.workspace.getConfiguration().get("base16.generator.activatedThemes") as string[];
  const result = writeActivatedThemes(themes);

  if (result.equal) {
    return;
  }

  const resultStrings = [];
  if (result.added) {
    resultStrings.push(`${result.added} Added`);
  }
  if (result.removed) {
    resultStrings.push(`${result.removed} Removed`);
  }
  if (!result.added && !result.removed && result.reordered) {
    resultStrings.push(`${result.reordered} Ordered`);
  }

  await promptRestart(`Base16 theme has changed (${resultStrings.join(", ")}). Please restart VSCode.`);
}
