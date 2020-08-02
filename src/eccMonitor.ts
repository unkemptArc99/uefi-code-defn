import * as vscode from 'vscode';
import * as child from 'child_process';
import { Console } from 'console';
import { glob } from 'glob';
import { stringify } from 'querystring';
import { Stats, PathLike } from 'fs';

let fs = require('fs');
let path = require('path');
let os = require('os');

const {spawn} = require('child_process');
const {spawnSync} = require('child_process');


export class EccMonitor {
    private tempDir:string = os.tmpdir();
    private outputDirectoryName:string = "uefi-code-defn-op";
    private outputPath:string = path.join(this.tempDir, this.outputDirectoryName);

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
        let deletionScript:PathLike = await this.createOutputDeletionScript();
        console.log(deletionScript);
        await this.runOutputDeletionScript(deletionScript);
        await this.deleteOutputDeletionScript(deletionScript);
    }

    private createOutputPath () {
      console.log("Decided output Path : " + this.outputPath);
  
  
      if(fs.existsSync(this.outputPath)) {
        console.log ("Output directory exists");
        this.cleanUpOutputPath();
      } else {
        console.log ("Doesnot exist");
      }
    }
  
    private createAllBatchFiles (fileName:vscode.Uri) {
      this.createOutputPath();
      return;
      console.log("Creating Batch");
      let fs = require('fs');
      fs.writeFile('C:\\Windows\\Temp\\file.txt', 'I am Nishanth', (err:Error) => {
        if (err) {
          throw(err);
        }
        console.log("Done");
      });
    }
  
    private changedTextDocument (fileName : vscode.Uri) {
  
      try {
        this.createAllBatchFiles(fileName);
        return;
      } catch (err) {
        console.error(err);
        throw(err);
      }
  
      let filePath = fileName.fsPath;
      console.log(filePath);
  
      console.log("Spawning process");
      // const { spawn } = require('child_process');
      const bat = spawn('cmd.exe',['/c','C:\\git\\Others\\hackathon\\uefi-code-defn\\src\\somefile.bat']);
  
      bat.stdout.on('data', (data:any) => {
        // console.log(data.toString());
      });
      
      bat.stderr.on('data', (data:any) => {
        // console.error(data.toString());
      });
      
      bat.on('exit', (code:any) => {
        console.log(`Child exited with code ${code}`);
        this.scriptExecutionComplete();
      });
  
      console.log("Created events");
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
  