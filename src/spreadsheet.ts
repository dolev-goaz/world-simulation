import * as ExcelJS from "exceljs";
import * as FileSaver from "file-saver";
import { Statistics } from "./simulation/simulation";

const headerInfo = {
    row: {
        order: 0,
        header: 'Generation',
        width: 12,
    },
    temperature: {
        order: 1,
        header: 'Temperature',
        width: 13,
        style: { numFmt: '0.0000ºC' }
    },
    airPollution: {
        order: 2,
        header: 'Air Pollution',
        width: 14,
        style: { numFmt: '0.00%' }
    },
    temperatureNormalized: {
        order: 3,
        header: 'Temperature Normalized',
        width: 25,
        style: { numFmt: '0.0000' }
    },
    airPollutionNormalized: {
        order: 4,
        header: 'Air Pollution Normalized',
        width: 25,
        style: { numFmt: '0.0000' },
    },
} satisfies Record<string, Partial<ExcelJS.Column> & { order: number }>;

const headerKeys = Object.keys(headerInfo) as Array<keyof typeof headerInfo>;

export async function writeSpreadSheet(statistics: Statistics, filename: string = 'export') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("output");
    worksheet.columns = headerKeys.map((key) => ({
        key,
        ...headerInfo[key]
    }));
    const rows = statisticsToData(statistics);
    rows.forEach((row) => worksheet.addRow(row));

    writeStatisticsMinMax(worksheet, statistics);

    const buffer = await workbook.xlsx.writeBuffer();
    FileSaver.saveAs(new Blob([buffer]), `${filename}.xlsx`);
}
function writeStatisticsMinMax(worksheet: ExcelJS.Worksheet, statistics: Statistics) {
    const spaceBetweenTables = 1;
    const columnsPerTable = 4;
    const headerRow = 3;
    let startColumn = worksheet.columns.length + 3;
    const keys = Object.keys(statistics) as Array<keyof Statistics>;

    keys.forEach((key) => {
        const headerData = headerInfo[key];
        const dataColumn = worksheet.getColumn(headerData.order + 1).letter; // indexes are 1-based in excel

        worksheet.mergeCells(headerRow, startColumn, headerRow, startColumn + (columnsPerTable - 1));
        worksheet.getCell(headerRow, startColumn).value = headerData.header;
        worksheet.getCell(headerRow, startColumn).style = {
            alignment: { horizontal: 'center' },
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF3399FF" } },
            font: { color: { argb: 'FFFFFFFF' }, bold: true }
        };
        Array.from({length: columnsPerTable}).forEach((_, ind) => worksheet.getColumn(startColumn + ind).width = headerData.width);

        // min
        worksheet.getCell(headerRow + 1, startColumn).value = 'min';
        worksheet.getCell(headerRow + 1, startColumn).style = { alignment: { horizontal: 'center' } };

        worksheet.getCell(headerRow + 2, startColumn).value = {
            formula: `MIN(${dataColumn}:${dataColumn})`
        };
        worksheet.getCell(headerRow + 2, startColumn).style = { ...headerData.style, alignment: { horizontal: 'center' } };

        // max
        worksheet.getCell(headerRow + 1, startColumn + 1).value = 'max';
        worksheet.getCell(headerRow + 1, startColumn + 1).style = { alignment: { horizontal: 'center' } };
        worksheet.getCell(headerRow + 2, startColumn + 1).value = {
            formula: `MAX(${dataColumn}:${dataColumn})`
        };
        worksheet.getCell(headerRow + 2, startColumn + 1).style = { ...headerData.style, alignment: { horizontal: 'center' } };

        // mean
        worksheet.getCell(headerRow + 1, startColumn + 2).value = 'mean';
        worksheet.getCell(headerRow + 1, startColumn + 2).style = { alignment: { horizontal: 'center' } };
        worksheet.getCell(headerRow + 2, startColumn + 2).value = {
            formula: `AVERAGE(${dataColumn}:${dataColumn})`
        };
        worksheet.getCell(headerRow + 2, startColumn + 2).style = { ...headerData.style, alignment: { horizontal: 'center' } };

        // standard deviation
        worksheet.getCell(headerRow + 1, startColumn + 3).value = 'stdev';
        worksheet.getCell(headerRow + 1, startColumn + 3).style = { ...headerData.style, alignment: { horizontal: 'center' } };
        worksheet.getCell(headerRow + 2, startColumn + 3).value = {
            formula: `STDEV(${dataColumn}:${dataColumn})`
        };
        worksheet.getCell(headerRow + 2, startColumn + 3).style = { ...headerData.style, alignment: { horizontal: 'center' } };

        startColumn += columnsPerTable + spaceBetweenTables;
    });
}

function statisticsToData(statistics: Statistics): Record<string, number>[] {
    const statisticsSets = Object.fromEntries(
        Object.entries(statistics).map(([key, value]) => ([key, value.set]))
    );
    const normalizedSets = normalizedStatistics(statistics);

    const data = {
        ...statisticsSets,
        ...normalizedSets
    }

    return combineStatistics(data);
}

function normalizedStatistics(statistics: Statistics) {
    const out: Record<string, number[]> = {};
    const entries = Object.entries(statistics);
    entries.forEach(([key, value]) => {
        const newKey = `${key}Normalized`;
        const newSet = value.set.map((setItem) => (setItem - value.mean) / value.stdDeviation);
        out[newKey] = newSet;
    });

    return out;
}

function combineStatistics(dataSets: Record<string, number[]>) {
    const keys = Object.keys(dataSets);
    const setLength = Math.min(...Object.values(dataSets).map((set) => set.length));
    return Array.from({ length: setLength }).map((_, index) => {
        const out: Record<string, number> = {};

        keys.forEach((key) => out[key] = dataSets[key][index]);
        out['row'] = index;
        return out;
    });
}