import * as ExcelJS from "exceljs";
import * as FileSaver from "file-saver";
import { Statistics } from "./simulation/simulation";

const headerInfo = {
    row: {
        header: 'Generation',
        width: 12,
    },
    temperature: {
        header: 'Temperature',
        width: 13,
        style: { numFmt: '0.0000'}
    },
    airPollution: {
        header: 'Air Pollution',
        width: 14,
        style: { numFmt: '0.00%'}
    },
    temperatureNormalized: {
        header: 'Temperature Normalized',
        width: 25,
        style: { numFmt: '0.0000'}
    },
    airPollutionNormalized: {
        header: 'Air Pollution Normalized',
        width: 25,
        style: { numFmt: '0.0000'},
    },
} as Record<string, Partial<ExcelJS.Column>>;

const headerKeys = Object.keys(headerInfo) as Array<keyof typeof headerInfo>;

export async function writeSpreadSheet(statistics: Statistics, filename: string = 'export') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("output");
    worksheet.columns = headerKeys.map((key) => ({
        key,
        ...headerInfo[key]
    }));
    const rows = statisticsToData(statistics);
    rows.forEach((row) =>worksheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    FileSaver.saveAs(new Blob([buffer]), `${filename}.xlsx`);
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
    console.log(setLength)

    return Array.from({length: setLength}).map((_, index) => {
        const out: Record<string, number> = {};

        keys.forEach((key) => out[key] = dataSets[key][index]);
        out['row'] = index + 1;
        return out;
    });
}