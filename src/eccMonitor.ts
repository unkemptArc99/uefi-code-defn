// All imports
import * as vscode from 'vscode';
import { PathLike } from 'fs';
import { ExcelUtility } from './excelUtility';
import { IEccData } from './IeccData';

// All constants
let fs = require('fs');
let path = require('path');
let os = require('os');
const { spawnSync } = require('child_process');


// The EccMonitor class
// contains all methods related to setting up a monitor for detecting any kind of change in the vscode instance
export class EccMonitor {
    /* 
     * Attributes
     */

    // The edk2 repository path should not exist in the future
    // Should be removed after porting to the js ecc
    private edk2repository:string = 'C:\\git\\Others\\hackathon\\uefi-code-defn\\src\\edk2\\';
    get edk2Repository() {
        return this.edk2repository;
    } 

    // Variables containing the path to the temp directory
    // that can be used for some processing.
    private tempDir:string = os.tmpdir();
    private outputDirectoryName:string = "uefi-code-defn-op";

    // The output paths are set to public for any future child classes to use
    public outputPath:string = path.join(this.tempDir, this.outputDirectoryName);
    public outputScriptDirectory:string = path.join(this.outputPath, 'Scripts');

    // All ecc bat scripts should be removed in the future after porting the tool to js ecc
    private eccScriptFilePath:string = path.join(this.outputScriptDirectory, 'eccScript.bat');
    private eccGenRoot:string = path.join(this.outputPath, 'EccGen');
    private eccGenCopiedFiles:string = path.join(this.eccGenRoot, 'Copied');
    private eccGenOutputDir:string = path.join(this.eccGenRoot, 'Output');


    /* 
     * Methods
     */

    // Method that performs clean up to remove any kind of mess that was left uncleaned in previous instance
    private async performCleanup() {
        // Empty at the moment
        // --------------------------------------------------------------------------------
    }


     // Method to create the output deletion script
    private createOutputDeletionScript () {
        let deletionScript:PathLike = path.join(this.tempDir,"deletionScript.bat");

        let fileContent:string ="";
        fileContent += "rmdir /s /q ";
        fileContent += this.outputPath;

        // Writing the deletion script to the deletionScript.bat file
        fs.writeFileSync(deletionScript, fileContent, (err:Error) => {
            if (err) {
                console.error("Error in file creation");
            }
        });
        return deletionScript;
    }


    // Method to run the outpu deletion script that will delete the old cached output folder
    private runOutputDeletionScript (scriptPath:PathLike) {
        console.log("Running the following script file : " + scriptPath);
        spawnSync("cmd.exe", ['/c', scriptPath]);
    }


    // Method to delete the output deletion script that was created
    private deleteOutputDeletionScript (deletionScript:PathLike) {
        let deleteCommand:string = "del " + deletionScript;
        spawnSync("cmd.exe",['/c',deleteCommand]);
    }


    // Method to clean up the output path
    // this will create a script file that will delete the output directory
    // this long route is taken because rmdir is not working.
    private async cleanUpOutputPath () {
        let deletionScript:PathLike = this.createOutputDeletionScript();
        console.log(deletionScript);
        this.runOutputDeletionScript(deletionScript);
        this.deleteOutputDeletionScript(deletionScript);
    }


    // Method to create the EccGenerationScript that is stored in the script directory
    private async createEccGenerationScript() {
        let fileContent : string = '';

        // point to the edk2 repository
        fileContent += 'cd ' + this.edk2repository + '\n';

        // print the params
        fileContent += "@echo arg1 %1" + '\n' + "@echo arg2 %2" + '\n';

        // run the edk2 setup bat
        fileContent += 'call edksetup.bat\n';

        if(!fs.existsSync(this.outputScriptDirectory)) {
            throw("Synchronization issues. Output directory does not exist.");
        }

        fileContent += '@echo Done with setup' + '\n';
        // fileContent += 'cd BaseTools\\Source\\Python\\Ecc\\' + '\n';

        // run the ecc
        fileContent += 'Ecc -t %1 -r %2' + '\n';

        // Create the edk2setup bat file
        fs.writeFileSync(this.eccScriptFilePath, fileContent, (err:Error) => {
            if (err) {
                console.log("Error in file creation");
            }
            console.log("Created Ecc generation script");
        });
    }


    // Method to create an output directory and delete the old instances
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


    // Method to copy the file that was just saved to the temporary output folder
    private async copyFileToOutputFolder(fileName:vscode.Uri) {
        let filePath:string = fileName.fsPath.toString();

        // this is the copy command
        // copy x y => copies x to y
        let commandToExecute:string = 'copy ' + filePath + ' ' + this.eccGenCopiedFiles;

        // executing the copy command in sync to avoid any kind of multithreading issues
        spawnSync('cmd.exe',['/c',commandToExecute, '/Y']);

        // this is the new path which will contain the copied file that was just saved
        let newPath:string = path.join(this.eccGenCopiedFiles, filePath.split('\\').splice(-1).toString());

        return newPath;
    }


    // Method to clear the copied files from the Ecc\Copied folder where the 
    // recently saved files are copied temporarily
    private async clearEccCopiedFilesFolder(fileToBeDeleted:string) {
        let command:string = "del " + fileToBeDeleted;
        spawnSync('cmd.exe', ['/c', command]);
    }


    // Method to the run the ecc test and trigger the excel
    private async runEccTest (fileName:vscode.Uri) {
        // terms related to folder names and trimming

        // the file that was saved recently
        let tempFileName:string = await this.copyFileToOutputFolder(fileName);
        // the file name split into array
        let fileNameObject:Array<string> = tempFileName.split('\\');
        // the directory of the save file
        let fileDirectory = fileNameObject.splice(0,fileNameObject.length-1).join('\\').toString();
        // just the file name with the extension
        let justFileName:string = fileNameObject[fileNameObject.length-1].toString();
        // the name of the output file which is the file name and a .csv extension appended to it
        let outputFileName:string = justFileName + '.csv';
        // the path of the output file which is nothing but the new
        let outputFilePath:string = path.join(this.eccGenOutputDir,outputFileName);

        // add part of code to copy the details to a map
        // This is the object that will be mapped
        // --------------------------------------------------------------------------------
        // let squiggleMap : Map<string,string> = new Map(); squiggleMap = 
        // --------------------------------------------------------------------------------

        // generate the call to create the excel sheet
        // In the future instead of calling this method
        // The method to the ported ecc tool will be called here.
        await ExcelUtility.createEccDataObject(this.eccScriptFilePath, fileName.fsPath, fileDirectory, outputFilePath);

        // call to clear the copied file from the folder as the processing is done
        await this.clearEccCopiedFilesFolder(tempFileName);
    }

    // this method is called whenever a change in a text document is noticed
    // at the moment only the ecc test is run
    private async changedTextDocument (fileName : vscode.Uri) {
        await this.runEccTest(fileName);
        return;
    }


    // Method that actually calls the changed Text document event.
    // This one needs some improvement --------------------------------------------------------------------------------
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


    // Method to perform setup
    private async performSetup () {
        // the first thing to do is clean up the old mess that was made
        await this.performCleanup();

        // creating the output directory for this instance
        await this.createOutputDirectory();
    }


    // Method that is run whenever a new file is created
    private newFileOpenedEvent (textDocument:vscode.TextDocument) {
        if (textDocument.fileName.endsWith('.git')) {
            return;
        }
        console.log('New file opened');
        console.log(textDocument.fileName);
        this.runEccTest(textDocument.uri);
    }


    // Method that is run whenever a file is closed
    private fileCloseEvent (textDocument:vscode.TextDocument) {
        if (textDocument.fileName.endsWith('.git')) {
            return;
        }
        console.log('File closed');
        console.log(textDocument.fileName);
    }


    // Constructor method that is called whenever an object is created
    constructor (globPattern: vscode.GlobPattern) {
        ExcelUtility.cetm("C:\\Users\\nisanjee\\Desktop\\Output\\HelloWorld.c.csv",
        "C:\\git\\Others\\hackathon\\uefi-code-defn\\src\\test\\sample_environment\\HelloWorldDriver\\HelloWorld.c"
        );
        return;
        this.performSetup();

        let eccMonitorFileWatcher = vscode.workspace.createFileSystemWatcher (globPattern);

        // Event that is triggered whenever a document is opened
        // vscode.workspace.onDidOpenTextDocument (textDocument => this.newFileOpenedEvent(textDocument));

        // Event that is triggered whenever a document is closed
        // vscode.workspace.onDidCloseTextDocument (textDocument => this.fileCloseEvent(textDocument));

        eccMonitorFileWatcher.onDidChange(event => this.EccMonitorEvent(event, 1));
        eccMonitorFileWatcher.onDidCreate(event => this.EccMonitorEvent(event, 2));
        eccMonitorFileWatcher.onDidDelete(event => this.EccMonitorEvent(event, 3));
    }


    // The destructor method in the name cleanUp
    // All clean up that needs to be performed when the vscode file is closed should go here
    // There should be a better way to call it based on a close event instead of calling 
    // this manually in the deactivate method
    public async cleanUp () {
        this.cleanUpOutputPath();
    }
}
