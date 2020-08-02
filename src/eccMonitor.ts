import * as vscode from 'vscode';
import * as child from 'child_process';
import { Console } from 'console';
import { glob } from 'glob';
import { stringify } from 'querystring';
import { Stats, PathLike } from 'fs';

let fs = require('fs');
let path = require('path');
let os = require('os');

let edk2repository = 'C:\\git\\Others\\edk2\\';

const {spawn} = require('child_process');
const {spawnSync} = require('child_process');


export class EccMonitor {
    private tempDir:string = os.tmpdir();
    private outputDirectoryName:string = "uefi-code-defn-op";
    private outputPath:string = path.join(this.tempDir, this.outputDirectoryName);
    private outputScriptDirectory:string = path.join(this.outputPath, 'Scripts');
    private eccScript:string = path.join(this.outputScriptDirectory, 'ecc.bat');
    private eccGenRoot:string = path.join(this.outputPath, 'EccGen');
    private eccGenCopiedFiles:string = path.join(this.eccGenRoot, 'Copied');
    private eccGenOutputDir:string = path.join(this.eccGenRoot, 'Output');

    // A function to print the message that the execution of a script has been complete.
    // Should be removed probably
    private scriptExecutionComplete() {
        console.log("Script has been executed completely");
    }

    // method to create the output deletion script
    private createOutputDeletionScript () {
        console.log("Creating output deleting script");
        let deletionScript:PathLike = path.join(this.tempDir,"deletionScript.bat");
        console.log("Deletion script path : " + deletionScript);

        let fileContent:string ="";
        fileContent += "rmdir /s /q ";
        fileContent += this.outputPath;
        console.log("file content : " + fileContent);

        fs.writeFileSync(deletionScript, fileContent, (err:Error) => {
            if (err) {
                console.log("Error in file creation");
            }
            console.log("File created");
        });
        return deletionScript;
    }

    // method to delete the output deletion script that was created
    private deleteOutputDeletionScript (deletionScript:PathLike) {
        console.log("Deleting the script");
        let deleteCommand:string = "del " + deletionScript;
        console.log("Delete command : " + deleteCommand);
        spawnSync("cmd.exe",['/c',deleteCommand]);
    }

    // method to run the outpu deletion script that will delete the old cached output folder
    private runOutputDeletionScript (scriptPath:PathLike) {
        console.log("Running the following script file : " + scriptPath);
        spawnSync("cmd.exe", ['/c', scriptPath]);
    }

    // method to clean up the output path
    // this will create a script file that will delete the output directory
    // this long route is taken because rmdir is not working.
    private async cleanUpOutputPath () {
        let deletionScript:PathLike = this.createOutputDeletionScript();
        console.log(deletionScript);
        this.runOutputDeletionScript(deletionScript);
        this.deleteOutputDeletionScript(deletionScript);
    }

    // method to create an output directory and delete the old instances
    private async createOutputDirectory () {
      if(fs.existsSync(this.outputPath)) {
        this.cleanUpOutputPath();
      }

      // Create the root output directory
      if (!fs.existsSync(this.outputPath)) {
        fs.mkdirSync(this.outputPath);
      }

      // Create the directory that will have all the script outputs
      if (!fs.existsSync(this.outputScriptDirectory)) {
        fs.mkdirSync(this.outputScriptDirectory);
        await this.createEccGenerationScript();
    }

      // Create the directory that will have all ecc related files
      if (!fs.existsSync(this.eccGenRoot)) {
        fs.mkdirSync(this.eccGenRoot);
        fs.mkdirSync(this.eccGenCopiedFiles);
        fs.mkdirSync(this.eccGenOutputDir);
      }
    }

    private async copyFileToOutputFolder(fileName:vscode.Uri) {
        let filePath:string = fileName.fsPath.toString();
        let commandToExecute:string = 'copy ' + filePath + ' ' + this.eccGenCopiedFiles;
        spawnSync('cmd.exe',['/c',commandToExecute, '/Y']);

        let newPath:string = path.join(this.eccGenCopiedFiles, filePath.split('\\').splice(-1).toString());
        console.log(newPath);

        return newPath;
    }

    // Method to create the EccGenerationScript that is stored in the script directory
    private async createEccGenerationScript() {
        let fileContent : string = '';
        let edkSetupScriptFilePath = path.join(this.outputScriptDirectory,'edkSetup.bat');
        let eccScriptFilePath = path.join(this.outputScriptDirectory, 'ecc.bat');

        // point to the edk2 repository
        fileContent += 'cd ' + edk2repository + '\n';

        // run the edk2 setup bat
        fileContent += 'edksetup.bat\n';

        if(!fs.existsSync(this.outputScriptDirectory)) {
            throw("Synchronization issues. Output directory does not exist.");
        }

        // Create the edk2setup bat file
        fs.writeFileSync(edkSetupScriptFilePath, fileContent, (err:Error) => {
            if (err) {
                console.log("Error in file creation");
            }
            console.log("Created Ecc generation script");
        });


        // point to the ecc repository
        fileContent += 'cd ' + edk2repository + '\n';
        fileContent += 'cd BaseTools\\Source\\Python\\Ecc\\' + '\n';

        // run the ecc
        fileContent += 'ecc -t %1 -r %2' + '\n';

        // Create the edk2setup bat file
        fs.writeFileSync(eccScriptFilePath, fileContent, (err:Error) => {
            if (err) {
                console.log("Error in file creation");
            }
            console.log("Created Ecc generation script");
        });
    }

    // method to create batch files for generating excel sheets
    private async generateEccXls (fileName:vscode.Uri) {
        let tempFileName:string = await this.copyFileToOutputFolder(fileName);
        let justFileName:string = tempFileName.split('\\').splice(-1).toString();
        let tempFileNameWithCsvExtension:string = justFileName.split('.').splice(0,1).toString() + '.csv';
        let outputFileName:string = path.join(this.eccGenOutputDir,tempFileNameWithCsvExtension);
        let command:string = this.eccScript + ' ' + tempFileName + ' ' + outputFileName;
        console.log("Command input :", command);

        // Spawning the child process to create the excel file
        spawnSync('cmd.exe', ['\c', command]);
        console.log("Ran the command to create the excel sheet");
    }

    // method to the run the ecc test and trigger the excel
    private async runEccTest (fileName:vscode.Uri) {
        await this.generateEccXls(fileName);
        console.log("Created the excel sheet");
    }

    // this method is called whenever a change in a text document is noticed
    private async changedTextDocument (fileName : vscode.Uri) {
        await this.runEccTest(fileName);
        return;
    }
  
    private EccMonitorEvent (event: vscode.Uri, flags: number) {
      if (flags === 1) {
        console.log("Ecc monitor Change noticed.");
      } else if (flags === 2) {
        console.log("Ecc monitor Creation noticed.");
      } else if (flags === 3) {
        console.log("Ecc monitor Deletion noticed.");
      }
    
      this.changedTextDocument(event);
    }

    private async performCleanup() {
        console.log("This method performs all clean up");
        
    }

    private async performSetup () {
        // the first thing to do is clean up the old mess that was made
        await this.performCleanup();

        // creating the output directory for this instance
        await this.createOutputDirectory();
    }

    private newFileOpenedEvent (textDocument:vscode.TextDocument) {
        if (textDocument.fileName.endsWith('.git')) {
            return;
        }
        console.log('New file opened');
        console.log(textDocument.fileName);
        // this.runEccTest(textDocument.uri);
    }

    private fileCloseEvent (textDocument:vscode.TextDocument) {
        if (textDocument.fileName.endsWith('.git')) {
            return;
        }
        console.log('File closed');
        console.log(textDocument.fileName);
    }

    constructor (globPattern: vscode.GlobPattern) {
        this.performSetup();

        console.log("constructor is synchronous");
        let eccMonitorFileWatcher = vscode.workspace.createFileSystemWatcher (globPattern);

        // Event that is triggered whenever a document is opened
        // vscode.workspace.onDidOpenTextDocument (textDocument => this.newFileOpenedEvent(textDocument));

        // Event that is triggered whenever a document is closed
        // vscode.workspace.onDidCloseTextDocument (textDocument => this.fileCloseEvent(textDocument));

        eccMonitorFileWatcher.onDidChange(event => this.EccMonitorEvent(event, 1));
        eccMonitorFileWatcher.onDidCreate(event => this.EccMonitorEvent(event, 2));
        eccMonitorFileWatcher.onDidDelete(event => this.EccMonitorEvent(event, 3));
    }
}
