import { Cell, createCell, drawCell } from "./cell";
import config from "../config.json";

export class Map {
    cells: Cell[];

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(rows: number, cols: number, cellSize: number) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = config.CellSize * config.CellsInColumn;
        this.canvas.height = config.CellSize * config.CellsInRow;

        document.body.appendChild(this.canvas);

        const ctx = this.canvas.getContext("2d");
        if (!ctx) {
            alert("An error has occured. please refresh");
            throw new Error("An error has occured. please refresh");
        }
        this.ctx = ctx;

        this.cells = [];
        Array.from({ length: rows }).forEach((_, rowIndex) => {
            Array.from({ length: cols }).forEach((_, colIndex) => {
                this.cells.push(createCell(colIndex, rowIndex, cellSize));
            });
        });

    }

    private drawCell(cell: Cell) {
        drawCell(this.ctx, cell);
    }

    draw() {
        this.cells.forEach(this.drawCell.bind(this));
    }
}