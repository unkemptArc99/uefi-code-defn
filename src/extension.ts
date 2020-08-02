// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child from 'child_process';
import { Console } from 'console';
import { glob } from 'glob';
import { stringify } from 'querystring';
import { Stats, PathLike } from 'fs';

let fileStore: Map<string, vscode.Location> = new Map();
let fileWatcher: vscode.FileSystemWatcher;
let EccMonitorObject : EccMonitor;
let fileList: Array<string>;

async function parseFile (fileName: vscode.Uri) {
  // Open the file for processing
  vscode.workspace.openTextDocument(fileName).then((fileContent) => {
    let textContent = fileContent.getText();
    // Pattern which searches Pcd declaration
    let pattern = /\b\w+\.(Pcd\w+)[\ ]*\|.+\b/g;
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
    let pattern = /\b\w+\.(Pcd\w+)[\ ]*\|.+\b/g;
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

class EccMonitor {
  private folderParse = 0;

  private changedTextDocument (fileName : vscode.Uri) {
    let filePath = fileName.fsPath;
    console.log(filePath);

    console.log("Spawning process");
    const { spawn} = require('child_process');
    const bat = spawn('cmd.exe',['/c','C:\\git\\Others\\hackathon\\uefi-code-defn\\src\\somefile.bat']);

    bat.stdout.on('data', (data:any) => {
      console.log(data.toString());
    });
    
    bat.stderr.on('data', (data:any) => {
      console.error(data.toString());
    });
    
    bat.on('exit', (code:any) => {
      console.log(`Child exited with code ${code}`);
    });

    console.log("Created events");


    // console.log("Executing child process");
    // const { execFileSync } = require('child_process');
    // execFileSync('C:\\Windows\\System32\\cmd.exe', ['/c', 'somefile.cmd'], (error:any, stdout:any, stderr:any) => {
    //   if (error) {
    //     console.error(`exec error: ${error}`);
    //     return;
    //   }
    //   console.log('stdoutput:');
    //   console.log(`stdout: ${stdout}`);
    //   console.error(`stderr: ${stderr}`);
    // });


    // let wshShell:ActiveXObject;
    // try {
    //   console.log('Executing somefile.bat');
    //   child.execFileSync('somefile.cmd');
    //   console.log('Executed somefile.bat');
    // } catch(e) {
    //   console.log("error occured");
    //   console.log(e.toString());
    // }
    console.log("Post try catch.");
  }

  public EccMonitorEvent (event: vscode.Uri, flags: number) {
    if (flags === 1) {
      console.log("Ecc monitor Change noticed.");
    } else if (flags === 2) {
      console.log("Ecc monitor Creation noticed.");
    } else if (flags === 3) {
      console.log("Ecc monitor Deletion noticed.");
    }
  
    this.changedTextDocument(event);
  }

  constructor (globPattern: vscode.GlobPattern) {
    let eccMonitorFileWatcher = vscode.workspace.createFileSystemWatcher (globPattern);
    eccMonitorFileWatcher.onDidChange(event => this.EccMonitorEvent(event, 1));
    eccMonitorFileWatcher.onDidCreate(event => this.EccMonitorEvent(event, 2));
    eccMonitorFileWatcher.onDidDelete(event => this.EccMonitorEvent(event, 3));
  }
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "uefi-code-defn" is now active!');

	let disposable = vscode.commands.registerCommand('uefi-code-defn.helloWorld', () => {
		vscode.window.showInformationMessage('UEFI extension is active now.');
  });

  let disposableQuery = vscode.commands.registerCommand('uefi-code-defn.queryFileStore', () => { 
    console.log(fileStore.get("PcdUartDefaultBaudRate"));
  });
  
  await parseDecContent();

	fileWatcher = vscode.workspace.createFileSystemWatcher ("**/*.dec");
	fileWatcher.onDidChange(event => refreshFileStore(event, 1));
	fileWatcher.onDidCreate(event => refreshFileStore(event, 2));
  fileWatcher.onDidDelete(event => refreshFileStore(event, 3));

  // Creating the ECC Monitor here
  // The eccmonitor file watcher can be created inside the class itself.
  // But the reason for creating an instance here is to specify any kind of file
  console.log("Creating ecc monitor file watcher");
  let eccMonitorObject = new EccMonitor("**/*.*");
  console.log("Created ecc monitor file watcher");

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
