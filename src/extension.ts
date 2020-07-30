// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let fileStore: Map<string, vscode.Location> = new Map();
let fileWatcher: vscode.FileSystemWatcher;

async function parseFile (fileName: vscode.Uri) {
  // Open the file for processing
  vscode.workspace.openTextDocument(fileName).then((fileContent) => {
    let textContent = fileContent.getText();
    // Pattern which searches Pcd declaration
    let pattern = /\b\w+\.(Pcd\w+)\|.+\b/g;
    let matchArr;
    while ((matchArr = pattern.exec(textContent)) !== null) {
      // Start and End positions of the location of the definiton of Pcd.
      let endPos: vscode.Position = fileContent.positionAt(pattern.lastIndex);
      let startPos: vscode.Position = fileContent.positionAt(pattern.lastIndex - matchArr[0].length);
      // Storing the Pcd in the map for better complexity on finding definitions.
      fileStore.set(matchArr[1], new vscode.Location(fileName, new vscode.Range(startPos, endPos)));
    }
  });
}

async function parseDecContent () {
	vscode.workspace.findFiles("**/*.dec").then(decFiles => {
		decFiles.forEach ((decFile) => {
      parseFile(decFile);
		});
	});
}

async function refreshFileStore(event: vscode.Uri) {
	await parseFile (event);
}

class DecDefinitionProvider implements vscode.DefinitionProvider {
  public provideDefinition (
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Location> {
    let wordRange = document.getWordRangeAtPosition(position);
    if (wordRange) {
      let searchStr = document.getText(wordRange);
      console.log(searchStr);
      let regexMatchArr = searchStr.match(/Pcd\w+/g);
      if (regexMatchArr && regexMatchArr.length > 0) {
        console.log(regexMatchArr[0]);
        let strLoc = fileStore.get(regexMatchArr[0]);
        console.log(strLoc);
        if (strLoc) {
            return strLoc;
        }
      }
    }
    return new Promise(reject => {
      return Error("Definiton not found");
    });
  }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "uefi-code-defn" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('uefi-code-defn.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		vscode.window.showInformationMessage('Hello World from uefi-code-defn!');
  });

  let disposableQuery = vscode.commands.registerCommand('uefi-code-defn.queryFileStore', () => { 
    console.log(fileStore.get("PcdUartDefaultBaudRate"));
  });
  
  await parseDecContent();

	fileWatcher = vscode.workspace.createFileSystemWatcher ("**/*.dec");
	fileWatcher.onDidChange(event => refreshFileStore(event));
	fileWatcher.onDidCreate(event => refreshFileStore(event));
  fileWatcher.onDidDelete(event => refreshFileStore(event));
  
  let disposableDefnProvider = vscode.languages.registerDefinitionProvider('c', new DecDefinitionProvider());

	context.subscriptions.push(disposable, disposableQuery, disposableDefnProvider);
}

// this method is called when your extension is deactivated
export function deactivate() {
  fileStore.clear();
  fileWatcher.dispose();
}
