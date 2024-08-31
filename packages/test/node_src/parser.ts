import Excel from 'exceljs';
import * as path from 'path';
import {ExcelInputFile, ExcelRowHandler, ParsedCommand} from "../cypress";
// import {ExcelRowHandler} from "@/support/command/excelRowHandler";
// import {val} from "cheerio/lib/api/attributes";

// const basePath = path.resolve(__dirname);

function getValue(cell) {
    return cell.text;
}

export const readExcel = async (file: ExcelInputFile): Promise<Record<number, ParsedCommand> | null> => {
    try {
        console.log('start read excel for ', file);
        // const fpath = path.resolve(basePath, file.fileName);
        // console.log('load excel data from ',fpath)
        const wb = new Excel.Workbook();
        await wb.xlsx.readFile(file.fileName);
        const sheet = wb.getWorksheet(file.sheetIndex === undefined ? 0 : file.sheetIndex);
        const count = sheet.actualRowCount;

        const rows = sheet.getRows(0, count+1);
        console.log('read excel sheet got rows: ', count);
        const result: Record<number, ParsedCommand> = {};
        if (rows && rows.length > 0) {
            rows.forEach(row => {
                const val: ParsedCommand = {
                    id: 0,
                    cmd: '',
                    key: '',
                    args: []
                };
                row.eachCell((cell, cn) => {
                    console.log('\n\ngot excel cell\n', getValue(cell) + '\n', cn);
                    if (cn == 1) {
                        let id = Number(getValue(cell));
                        if (id && id > 0)
                            val.id = id;
                    } else if (cn == 2) {
                        val.cmd = String(getValue(cell));
                    } else if (cn == 3) {
                        val.key = String(getValue(cell));
                    } else if (cn == 4) {
                        val.nextCmd = Number(getValue(cell)) || -1;
                    } else {
                        val.args.push(String(getValue(cell)));
                    }
                });
                console.log('got cmd line from row ', val)
                if (val.id && val.id > 0 && val.cmd && val.cmd.length > 0)
                    result[val.id] = val;
            });
        }
        return result;

    } catch (e) {
        console.error(e);
    }
    return null;
}

// export const commonExcelRowHandler: ExcelRowHandler = (row: string[]) => {
//
// }


