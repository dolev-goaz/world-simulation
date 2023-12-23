import { Cell, drawCell } from "./cell";
import config from "../config.json";

export class WorldMap {
    cells: Cell[];

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(cells: Cell[] = []) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = config.CellSize * config.CellsInColumn;
        this.canvas.height = config.CellSize * config.CellsInRow;

        document.body.appendChild(this.canvas);

        const ctx = this.canvas.getContext("2d");
        if (!ctx) throw new Error("An error has occured. please refresh");
        this.ctx = ctx;

        this.cells = cells;
    }

    private drawCell(cell: Cell) {
        drawCell(this.ctx, cell);
    }

    draw() {
        this.clear();
        this.cells.forEach(this.drawCell.bind(this));
    }

    clear() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}