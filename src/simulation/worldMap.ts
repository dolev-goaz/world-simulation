import { Cell, drawCell } from "./cell";
import config from "../config.json";

export class WorldMap {
    cells: Cell[];

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private cellTooltip: HTMLElement;

    constructor(cells: Cell[] = []) {
        const htmlElements = this.initializeMapHTML();
        if (!htmlElements) {
            alert("Error");
            throw new Error("Error");
        }
        this.canvas = htmlElements.canvas;
        this.cellTooltip = htmlElements.cellTooltip;

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
        if (!this.cellTooltip.hidden) this.onCanvasHoverEnd() // info isnt relevant
    }

    clear() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private onCanvasHover(event: MouseEvent) {
        const x = Math.floor(event.offsetX / config.CellSize);
        const y = Math.floor(event.offsetY / config.CellSize);

        const cell = this.cells[y * config.CellsInRow + x];

        this.cellTooltip.innerText = JSON.stringify(
            cell,
            (_, val) => typeof val === 'number'? Number(val.toFixed(3)): val,
            '\t'
        );
        this.cellTooltip.hidden = false;
    }
    private onCanvasHoverEnd() {
        this.cellTooltip.hidden = true;
        this.cellTooltip.innerText = '';
    }

    private initializeMapHTML() {
        const canvasParent = document.querySelector<HTMLDivElement>("#simulation-map")
        if (!canvasParent) return;
        const canvas = canvasParent.querySelector<HTMLCanvasElement>("canvas");
        if (!canvas) return;
        canvas.width = config.CellSize * config.CellsInColumn;
        canvas.height = config.CellSize * config.CellsInRow;
        canvas.onmousemove = this.onCanvasHover.bind(this);
        canvas.onmouseleave = this.onCanvasHoverEnd.bind(this);

        const cellTooltip = document.querySelector<HTMLParagraphElement>('p#tooltip');
        if (!cellTooltip) return;

        return {
            canvas,
            cellTooltip
        };
    }
}