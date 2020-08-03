// All Imports
import {Workbook, Row, Cell} from 'exceljs';

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

    // Method to convert the excel sheet to a map
    private static async convertExcelToMap (excelFileName:string) {
        console.log("Converting excel file to map");

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
    public static async createMap (eccScriptFilePath:string, folderPath:string, outputFileName:string) {
        // This method will generate the Excel sheet
        await ExcelUtility.generateEccXls (eccScriptFilePath, folderPath, outputFileName);

        console.log("Excel sheet generated. File available for convertion");

        // The output path is available. if some error occurred in previous step, this code will not be executed
        // -----------------------------------------------------------------------------------------------------
        await ExcelUtility.convertExcelToMap(outputFileName);
    }

    public static async cetm (fn:string) {
        ExcelUtility.convertExcelToMap(fn);
    }

    // All Class methods are static. Object creation is prohibited.
    constructor () {
        throw("This is a sealed class. All methods are static.");
    }
}


