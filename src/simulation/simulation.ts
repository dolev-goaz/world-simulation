import { WorldMap } from "./worldMap";
import config from "../config.json";
import { Cell } from "./cell";
import { Direction, TDirection } from "./direction";

type Neighbors = Record<TDirection, Cell>;

export class Simulation {
    map: WorldMap;
    cellNeighbors: Map<Cell, Neighbors>; // this is by reference so its fine

    constructor() {
        this.map = new WorldMap(config.CellsInRow, config.CellsInColumn, config.CellSize);

        this.cellNeighbors = new Map();

        this.map.cells.forEach((cell) => {
            this.cellNeighbors.set(cell, this.getNeighbors(cell));
        });
    }

    step() {
        this.map.draw();
        this.map.cells.forEach(this.updateCell.bind(this));
    }

    private updateCell(cell: Cell) {
        const neighbors = this.cellNeighbors.get(cell);
        if (!neighbors) throw new Error("Invalid cell")
    }

    private getNeighbors(cell: Cell) {
        return {
            [Direction.North]: this.getNeighbor(cell, -1, 0),
            [Direction.South]: this.getNeighbor(cell, 1, 0),
            [Direction.East]: this.getNeighbor(cell, 0, 1),
            [Direction.West]: this.getNeighbor(cell, 0, -1),
        }
    }

    private getNeighbor(cell: Cell, dy: number, dx: number) {
        const xIndex = (cell.indexX + dx) % config.CellsInRow;
        const yIndex = (cell.indexY + dy) % config.CellsInColumn;

        return this.map.cells[yIndex * config.CellsInRow + xIndex];
    }
}