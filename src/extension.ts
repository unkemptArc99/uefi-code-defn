// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

interface DefLocation {
	keyword: string,
	filePath: string,
	location: vscode.Location
}

function parseDecContent () {
	let resultJson = {
		dec : []
	};
	vscode.workspace.findFiles("**/*.dec").then(decFiles => {
		decFiles.forEach ((decFile, i, decFiles) => {
			let item = {};
			item["file"] = decFile.pathl
		});
	});
	
}

function createFileStore () {
	let fileSystem : vscode.FileSystem = vscode.workspace.fs;
	let workspaceRoot : string = "";
	if (vscode.workspace.workspaceFolders) {
	 workspaceRoot = vscode.workspace.workspaceFolders[0].name;
	}
	let fileStoreJsonPath : string = path.join(workspaceRoot, ".vscode/fileStore.json");
	let fileStoreJsonUri : vscode.Uri = vscode.Uri.file(fileStoreJsonPath);


	fileSystem.writeFile(fileStoreJsonUri, )

}

function refreshFileStore(event : vscode.Uri) {
	vscode.window.showInformationMessage(event.path);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "uefi-code-defn" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('uefi-code-defn.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		vscode.window.showInformationMessage('Hello World from uefi-code-defn!');
		if (vscode.workspace.workspaceFolders) {
			vscode.window.showInformationMessage (vscode.workspace.workspaceFolders[0].name);
		}
	});

	let fileWatcher : vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher ("**/*.dec");
	fileWatcher.onDidChange(event => refreshFileStore(event));
	fileWatcher.onDidCreate(event => refreshFileStore(event));
	fileWatcher.onDidDelete(event => refreshFileStore(event));

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
