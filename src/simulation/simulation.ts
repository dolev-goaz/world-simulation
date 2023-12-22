import { WorldMap } from "./worldMap";
import config from "../config.json";
import { Cell } from "./cell";
import { Direction, DirectionVectors, Directions, TDirection, addDirections, getDirectionFromVector } from "./direction";

type Neighbors = Record<Exclude<TDirection, 'None'>, Cell>;

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

    // TODO: should only affect the next generation's cell, not current cell
    private updateCell(cell: Cell) {
        const neighbors = this.cellNeighbors.get(cell);
        if (!neighbors) throw new Error("Invalid cell");

        this.updateCellWind(cell, neighbors);
    }

    private updateCellWind(cell: Cell, neighbors: Neighbors) {
        const affectingNeighbors = this.getNeighborsAffectingWind(cell, neighbors);

        const newVector = affectingNeighbors
            .map((neighbor) => DirectionVectors[neighbor.windDirection])
            .reduce((res, current) => {
                return addDirections(res, current);
            }, [0, 0]);

        const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
        const normalizedVector = newVector.map((force) => clamp(force, -1, 1)) as [number, number]; // normalize the wind

        cell.windDirection = getDirectionFromVector(normalizedVector);
    }

    private getNeighborsAffectingWind(cell: Cell, neighbors: Neighbors) {
        const out: Cell[] = [];
        Directions.forEach((direction) => {
            const neighborInDirection = neighbors[direction];
            if (!neighborInDirection) return;

            const neighborDirectionVector = DirectionVectors[direction];
            const neighborWindDirectionVector = DirectionVectors[neighborInDirection.windDirection];

            // console.log(neighborInDirection, neighborDirectionVector, neighborWindDirectionVector)
            const [dx, dy] = addDirections(neighborDirectionVector, neighborWindDirectionVector);

            // if the forces are opposing- the neighbor's wind affects the cell
            if (dx === 0 && dy === 0) {
                out.push(neighborInDirection);
            }
        });
        return out;
    }

    private getNeighbors(cell: Cell) {
        return {
            [Direction.North]: this.getNeighbor(cell, DirectionVectors[Direction.North]),
            [Direction.South]: this.getNeighbor(cell, DirectionVectors[Direction.South]),
            [Direction.East]: this.getNeighbor(cell, DirectionVectors[Direction.East]),
            [Direction.West]: this.getNeighbor(cell, DirectionVectors[Direction.West]),
            [Direction.NorthEast]: this.getNeighbor(cell, DirectionVectors[Direction.NorthEast]),
            [Direction.NorthWest]: this.getNeighbor(cell, DirectionVectors[Direction.NorthWest]),
            [Direction.SouthEast]: this.getNeighbor(cell, DirectionVectors[Direction.SouthEast]),
            [Direction.SouthWest]: this.getNeighbor(cell, DirectionVectors[Direction.SouthWest]),
        }
    }

    private getNeighbor(cell: Cell, [dx, dy]: [number, number]) {
        const xIndex = (cell.indexX + dx) % config.CellsInRow;
        const yIndex = (cell.indexY + dy) % config.CellsInColumn;

        return this.map.cells[yIndex * config.CellsInRow + xIndex];
    }
}