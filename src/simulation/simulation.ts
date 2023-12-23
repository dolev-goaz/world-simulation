import { WorldMap } from "./worldMap";
import config from "../config.json";
import { Cell, SimulationFields } from "./cell";
import { Direction, DirectionVectors, Directions, TDirection, addDirections, getDirectionFromVector } from "./direction";

type Neighbors = Record<Exclude<TDirection, 'None'>, Cell>;

export class Simulation {
    map: WorldMap;
    cellNeighbors: Map<Cell, Neighbors>; // this is by reference so its fine

    generation: number;
    private generationHeader: HTMLDivElement;

    constructor() {
        this.generation = 0;
        this.generationHeader = document.createElement('div');
        document.body.appendChild(this.generationHeader);
        this.updateHeader();

        this.map = new WorldMap(config.CellsInRow, config.CellsInColumn, config.CellSize);

        this.cellNeighbors = new Map();

        this.map.cells.forEach((cell) => {
            this.cellNeighbors.set(cell, this.getNeighbors(cell));
        });
    }

    private updateHeader() {
        const maxLength = 'Generation '.length + 4; // 4 digit generations
        this.generationHeader.style.width = `${maxLength}ch`
        this.generationHeader.innerText = `Generation ${this.generation}`;
    }

    calcNextGen() {
        this.map.cells.forEach((cell) => {
            cell.nextGenerationFields.strokeColor = 'black';
        });
        this.map.cells.forEach(this.calculateCellNextGen.bind(this));
    }
    moveNextGen() {
        this.map.cells.forEach(this.moveCellNextGen.bind(this));

        ++this.generation;
        this.updateHeader();
    }

    private moveCellNextGen(cell: Cell) {
        cell.currentGenerationFields = cell.nextGenerationFields as SimulationFields;
        cell.nextGenerationFields = {};
    }

    private calculateCellNextGen(cell: Cell) {
        const neighbors = this.cellNeighbors.get(cell);
        if (!neighbors) throw new Error("Invalid cell");

        this.updateCellWind(cell, neighbors);
    }

    // wind is only updated according to neighbors, not including the actual cell
    private updateCellWind(cell: Cell, neighbors: Neighbors) {
        const affectingNeighbors = this.getNeighborsAffectingWind(cell, neighbors);

        if (affectingNeighbors.length != 0) cell.currentGenerationFields.strokeColor = 'red';

        const newVector = affectingNeighbors
            .map((neighbor) => DirectionVectors[neighbor.currentGenerationFields.windDirection])
            .reduce((res, current) => {
                return addDirections(res, current);
            }, [0, 0]);

        const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
        const normalizedVector = newVector.map((force) => clamp(force, -1, 1)) as [number, number]; // normalize the wind

        cell.nextGenerationFields.windDirection = getDirectionFromVector(normalizedVector);
    }

    private getNeighborsAffectingWind(cell: Cell, neighbors: Neighbors) {
        const out: Cell[] = [];
        Directions.forEach((direction) => {
            const neighborInDirection = neighbors[direction];
            if (!neighborInDirection) return;

            if (neighborInDirection.currentGenerationFields.windDirection === Direction.None) return;
            const neighborDirectionVector = DirectionVectors[direction];
            const neighborWindDirectionVector = DirectionVectors[neighborInDirection.currentGenerationFields.windDirection];

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
        // neighbors are found cyclically- leftmost cell has the rightmost cell as its neighbor
        // bottom-most cell has the top-most cell as its neighbor
        const xIndex = (cell.indexX + dx + config.CellsInRow) % config.CellsInRow;
        const yIndex = (cell.indexY + dy + config.CellsInColumn) % config.CellsInColumn;

        return this.map.cells[yIndex * config.CellsInRow + xIndex];
    }
}