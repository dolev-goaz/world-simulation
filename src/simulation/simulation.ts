import { Map } from "./map";
import config from "../config.json";
import { Cell } from "./cell";

export class Simulation {
    map: Map;

    constructor() {
        this.map = new Map(config.CellsInRow, config.CellsInColumn, config.CellSize);
    }

    step() {
        this.map.draw();
        this.map.cells.forEach(this.updateCell.bind(this));
    }

    private updateCell(cell: Cell) {
        const neighbors = this.getNeighbors(cell);
    }

    private getNeighbors(cell: Cell) {
        return [
            this.getNeighbor(cell, 0, 1),
            this.getNeighbor(cell, 0, -1),
            this.getNeighbor(cell, 1, 0),
            this.getNeighbor(cell, -1, 0),
        ].filter(Boolean);
    }

    private getNeighbor(cell: Cell, dy: number, dx: number) {
        const xIndex = (cell.indexX + dx) % config.CellsInRow;
        const yIndex = (cell.indexY + dy) % config.CellsInColumn;

        return this.map.cells[yIndex * config.CellsInRow + xIndex];
    }
}