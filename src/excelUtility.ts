// All Imports
import { Workbook, Row, Cell, Worksheet } from 'exceljs';
import { IEccData } from './IeccData';

let fs = require('fs');

// All constants
const { spawnSync } = require('child_process');

// Class that handles the 
// 1. Creation of excel files
// 2. Converting the excel file to a map
export class ExcelUtility {
    /*
     * Attributes
    */

    /*
     * Methods
    */


    // Method to convert csv file to EccDataObject
    private static async convertCsvToEccDataObject (excelFile:string, fileName:string) {

        // EccDataArray that will be returned
        let EccDataArray:Array<IEccData> = new Array<IEccData>();

        // Reading the csv file
        let content:string = fs.readFileSync(excelFile).toString();

        // Splitting the csv file content to separate lines
        let contentList = content.split('\n');

        // Iterate through the list and find content
        for (let index:number = 1; index < contentList.length-1; index++) {
            let currentRow:string = contentList[index];
            let currentRowArray:Array<string> = currentRow.split(',');
            let eccDataObject:IEccData = {
                serialNumber : Number(currentRowArray[0]),
                errorCode : Number(currentRowArray[1]),
                errorMessage : '' + currentRowArray[2].toString(),
                fileName : fileName,
                lineNumber : Number(currentRowArray[4]),
                otherErrorMessage : '' + currentRowArray[5].toString()
            }

            if (eccDataObject.errorMessage != '' && eccDataObject.otherErrorMessage != '') {
                console.log(eccDataObject);
                EccDataArray.push(eccDataObject);
            }
        }
        return EccDataArray;
    }

    // Method to create batch files for generating excel sheets
    // this method just takes the two input args 
    // 1. folder path containing the copied files
    // 2. file names of the output
    // This method exists only for the sake of prototyping
    // Once the ecc tool is ported to js this should go away
    private static async generateEccXls (eccScriptFilePath:string, folderPath:string, outputFileName:string) {
        let command:string = eccScriptFilePath + ' ' + folderPath + ' ' + outputFileName;
        spawnSync ('cmd.exe',['/c',command]);
    }

    // This method should return a map
    public static async createEccDataObject (eccScriptFilePath:string, fileName:string, folderPath:string, outputFileName:string) {
        // This method will generate the Excel sheet
        await ExcelUtility.generateEccXls (eccScriptFilePath, folderPath, outputFileName);

        console.log('Excel sheet generated. File available for convertion');

        // The output path is available. if some error occurred in previous step, this code will not be executed
        return ExcelUtility.convertCsvToEccDataObject(outputFileName, fileName);
    }

    // prototyping method. Should be removed before committing
    public static async cetm (ofn:string, fn:string) {
        console.log('output file name : ' + ofn);
        console.log('file name : ' + fn);
        // ExcelUtility.convertExcelToEccDataObject(ofn, fn);
        return ExcelUtility.convertCsvToEccDataObject(ofn,fn);
    }

    // All Class methods are static. Object creation is prohibited.
    constructor () {
        throw('This is a sealed class. All methods are static.');
    }
}


