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

async function deleteFileStoreContents(event: vscode.Uri) {
  fileStore.forEach((value, key, map) => {
    if (value.uri === event) {
      fileStore.delete(key);
    }
  });
}

async function parseChangedFileContent(event: vscode.Uri) {
  // Open the file for processing
  vscode.workspace.openTextDocument(event).then((fileContent) => {
    let pcdList: Set<string> = new Set();
    let textContent = fileContent.getText();
    // Pattern which searches Pcd declaration
    let pattern = /\b\w+\.(Pcd\w+)\|.+\b/g;
    let matchArr;
    while ((matchArr = pattern.exec(textContent)) !== null) {
      // Start and End positions of the location of the definiton of Pcd.
      let endPos: vscode.Position = fileContent.positionAt(pattern.lastIndex);
      let startPos: vscode.Position = fileContent.positionAt(pattern.lastIndex - matchArr[0].length);
      // Storing the Pcd in the map for better complexity on finding definitions.
      pcdList.add(matchArr[1]);
      fileStore.set(matchArr[1], new vscode.Location(event, new vscode.Range(startPos, endPos)));
    }
    fileStore.forEach((v, k, m) => {
      if (v.uri === event && !pcdList.has(k)) {
        fileStore.delete(k);
      }
    });
    pcdList.clear();
  });
}

async function refreshFileStore(event: vscode.Uri, flags: number) {
  if (flags === 1) {
    await parseChangedFileContent(event);
  }
  else if (flags === 2) {
    await parseFile(event);
  }
  else if (flags === 3) {
    await deleteFileStoreContents(event);
  }
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

	console.log('Congratulations, your extension "uefi-code-defn" is now active!');

	let disposable = vscode.commands.registerCommand('uefi-code-defn.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from uefi-code-defn!');
  });

  let disposableQuery = vscode.commands.registerCommand('uefi-code-defn.queryFileStore', () => { 
    console.log(fileStore.get("PcdUartDefaultBaudRate"));
  });
  
  await parseDecContent();

	fileWatcher = vscode.workspace.createFileSystemWatcher ("**/*.dec");
	fileWatcher.onDidChange(event => refreshFileStore(event, 1));
	fileWatcher.onDidCreate(event => refreshFileStore(event, 2));
  fileWatcher.onDidDelete(event => refreshFileStore(event, 3));
  
  let disposableDefnProviderC = vscode.languages.registerDefinitionProvider('c', new DecDefinitionProvider());
  let disposableDefnProviderDSC = vscode.languages.registerDefinitionProvider('dsc', new DecDefinitionProvider());
  let disposableDefnProviderFDF = vscode.languages.registerDefinitionProvider('inf', new DecDefinitionProvider());
  let disposableDefnProviderINF = vscode.languages.registerDefinitionProvider('fdf', new DecDefinitionProvider());

  context.subscriptions.push(disposable, 
                             disposableQuery, 
                             disposableDefnProviderC,
                             disposableDefnProviderDSC,
                             disposableDefnProviderFDF,
                             disposableDefnProviderINF
                             );
}

// this method is called when your extension is deactivated
export function deactivate() {
  fileStore.clear();
  fileWatcher.dispose();
}
