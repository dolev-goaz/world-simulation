import { WorldMap } from "./worldMap";
import config from "../config.json";
import { Cell, CloudInfo, SimulationFields, createCell } from "./cell";
import { Direction, DirectionVectors, Directions, TDirection, Vector2D, addVectors, compareVectors, getDirectionFromVector, normalizeVector, randomDirection } from "./direction";
import { Area, TArea } from "./area";
import { randomRange } from "./helper";

type Neighbors = Record<Exclude<TDirection, 'None'>, Cell>;

export class Simulation {
    map: WorldMap;
    cellNeighbors: Map<Cell, Neighbors>; // this is by reference so its fine

    generation: number;
    private generationHeader: HTMLDivElement;

    constructor(areaMap: TArea[]) {
        this.generation = 0;
        this.generationHeader = document.createElement('div');
        document.body.appendChild(this.generationHeader);
        this.updateHeader();

        const cells: Cell[] = areaMap.map((area, index) => {
            const indexX = index % config.CellsInColumn
            const indexY = (index - indexX) / config.CellsInRow;
            return createCell(indexX, indexY, config.CellSize, randomDirection(), area)
        })
        this.map = new WorldMap(cells);

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
        const affectingNeighbors = this.getNeighborsAffectingWind(cell, neighbors);

        this.updateCellWind(cell, affectingNeighbors);
        this.updateCellCloud(cell, affectingNeighbors);
    }

    private updateCellCloud(cell: Cell, affectingNeighbors: Cell[]) {
        // Get clouds moving towards current cell
        const clouds = affectingNeighbors
            .map((neighbor) => neighbor.currentGenerationFields.cloud)
            .filter(Boolean) as CloudInfo[];

        if (cell.currentGenerationFields.windDirection == Direction.None && cell.currentGenerationFields.cloud) {
            // if the current cell has a cloud that won't move
            clouds.push(cell.currentGenerationFields.cloud);
        }

        if (clouds.length == 0) {
            let cloud: CloudInfo | undefined = undefined;
            // try to create new cloud
            if (cell.area == Area.Sea) {
                const randomChance = Math.random();
                if (randomChance < config.Cloud.FormChance.Sea) {
                    const lifespan = randomRange(config.Cloud.Lifespan.Min, config.Cloud.Lifespan.Max);
                    const timeToRain = randomRange(1, lifespan - 1);
                    cloud = {
                        timeToRain: timeToRain,
                        lifeRemaining: lifespan,
                    };
                }
            }
            cell.nextGenerationFields.cloud = cloud;
            return;
        }

        // if one of the clouds are raining- all of them are raining
        clouds.sort((cloudA, cloudB) => cloudB.lifeRemaining - cloudA.lifeRemaining);
        // if any cloud is raning- the new cloud is rainy
        const timeToRain = Math.min(...clouds.map((cloud) => cloud.timeToRain));

        // lifespan is the average of the cloud's lifespan.
        const lifespan = (clouds[0].lifeRemaining + clouds[clouds.length - 1].lifeRemaining) / 2;

        cell.nextGenerationFields.cloud = lifespan <= 0 ? undefined : { timeToRain: timeToRain - 1, lifeRemaining: lifespan - 1 };
    }

    // wind is only updated according to neighbors, not including the actual cell
    private updateCellWind(cell: Cell, affectingNeighbors: Cell[]) {
        // this is for debugging mostly- show which cells are affected by wind
        // if (affectingNeighbors.length != 0) cell.currentGenerationFields.strokeColor = 'red';

        const newVector = affectingNeighbors
            .map((neighbor) => DirectionVectors[neighbor.currentGenerationFields.windDirection])
            .reduce((res, current) => {
                return addVectors(res, current);
            }, [0, 0]);

        const normalizedVector = normalizeVector(newVector);
        cell.nextGenerationFields.windDirection = getDirectionFromVector(normalizedVector);
    }

    /**
     * Finds the neighbors which are having an effect on the current cell.
     * Finds them by those cell's wind, using vector arithmetic.
     * @returns 
     */
    private getNeighborsAffectingWind(_cell: Cell, neighbors: Neighbors) {
        const out: Cell[] = [];
        Directions.forEach((direction) => {
            const neighborInDirection = neighbors[direction];
            if (!neighborInDirection) return;

            if (neighborInDirection.currentGenerationFields.windDirection === Direction.None) return;
            const neighborDirectionVector = DirectionVectors[direction];
            const neighborWindDirectionVector = DirectionVectors[neighborInDirection.currentGenerationFields.windDirection];

            const sumVector = addVectors(neighborDirectionVector, neighborWindDirectionVector);

            // if the forces are opposing(sum is 0)- the neighbor's wind affects the cell
            if (compareVectors(sumVector, DirectionVectors[Direction.None])) {
                out.push(neighborInDirection);
            }
        });
        return out;
    }

    /**
     * Finds all the neighbors of the given cell.
     * Neighbors are cyclic- meaning the most top-left cell has the most bottom-right
     * cell as its neighbor
     */
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

    /**
     * Gets a of a cell neighbor in the given direction vector.
     */
    private getNeighbor(cell: Cell, [dx, dy]: Vector2D) {
        // neighbors are found cyclically- leftmost cell has the rightmost cell as its neighbor
        // bottom-most cell has the top-most cell as its neighbor
        const xIndex = (cell.indexX + dx + config.CellsInRow) % config.CellsInRow;
        const yIndex = (cell.indexY + dy + config.CellsInColumn) % config.CellsInColumn;

        return this.map.cells[yIndex * config.CellsInRow + xIndex];
    }
}