import * as ExcelJS from "exceljs";
import * as FileSaver from "file-saver";

export async function writeSpreadSheet(filename: string = 'export') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("test");
    worksheet.columns = [{ header: "Test Header", key: "test" }];
    worksheet.addRow({ test: 5 });

    const buffer = await workbook.xlsx.writeBuffer();
    FileSaver.saveAs(new Blob([buffer]), `${filename}.xlsx`);
}
