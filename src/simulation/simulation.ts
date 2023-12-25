import { WorldMap } from "./worldMap";
import config from "../config.json";
import { Cell, CloudInfo, SimulationFields, createCell } from "./cell";
import { Direction, DirectionVectors, Directions, TDirection, Vector2D, addVectors, compareVectors, getDirectionFromVector, normalizeVector, randomDirection } from "./direction";
import { Area, TArea } from "./area";
import { joinClouds, tryCreateCloud } from "./cloud";
import { clamp, getMean, getStandardDeviation } from "@/mathUtil";

type Neighbors = Record<Exclude<TDirection, 'None'>, Cell>;
type Statistic = {
    set: number[];
    mean: number;
    stdDeviation: number;
}
type Statistics = {
    temperature: Statistic;
    airPollution: Statistic;

}

export class Simulation {
    map: WorldMap;
    cellNeighbors: Map<Cell, Neighbors>; // this is by reference so its fine

    generation: number;

    statistics: Statistics;
    private generationHeader: HTMLDivElement;

    constructor(areaMap: TArea[]) {
        this.generation = 0;
        this.generationHeader = document.createElement('div');
        document.body.appendChild(this.generationHeader);
        this.updateHeader();

        const cells: Cell[] = areaMap.map((area, index) => {
            const indexX = index % config.CellsInColumn
            const indexY = (index - indexX) / config.CellsInRow;
            const windDirection = randomDirection();
            const temperature = config.InitialTemperatures[area];
            const pollution = config.InitialPollution[area];
            return createCell(indexX, indexY, config.CellSize, windDirection, area, temperature, pollution);
        })
        this.map = new WorldMap(cells);

        this.cellNeighbors = new Map();
        this.map.cells.forEach((cell) => {
            this.cellNeighbors.set(cell, this.getNeighbors(cell));
        });

        this.statistics = this.initializeStatistics();
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
        this.calculateStatistics();
    }

    private initializeStatistics() {
        const statisticsContainer = document.createElement('div');
        statisticsContainer.id = 'statistics-container';
        document.body.appendChild(statisticsContainer)
        return {
            airPollution: { set: [], stdDeviation: 0, mean: 0, },
            temperature: { set: [], stdDeviation: 0, mean: 0, }
        }
    }

    private calculateStatistics() {
        const generationPollutions = this.map.cells.map((cell) => cell.currentGenerationFields.airPollution);
        this.statistics.airPollution.set.push(getMean(generationPollutions));
        this.statistics.airPollution.mean = getMean(this.statistics.airPollution.set);
        this.statistics.airPollution.stdDeviation = getStandardDeviation(this.statistics.airPollution.set);

        const generationTemperatures = this.map.cells.map((cell) => cell.currentGenerationFields.temperature);
        this.statistics.temperature.set.push(getMean(generationTemperatures));
        this.statistics.temperature.mean = getMean(this.statistics.temperature.set);
        this.statistics.temperature.stdDeviation = getStandardDeviation(this.statistics.temperature.set);

        const statisticsContainer = document.querySelector<HTMLDivElement>('#statistics-container')!;
        statisticsContainer.innerText =
            `Air Pollution
            Mean: ${(100 * this.statistics.airPollution.mean).toFixed(1)}%
            Standard Deviation: ${(100 * this.statistics.airPollution.stdDeviation).toFixed(1)}%
            
            Temperature
            Mean: ${this.statistics.temperature.mean.toFixed(1)}ºC
            Standard Deviation: ${this.statistics.temperature.stdDeviation.toFixed(1)}ºC`
    }

    private moveCellNextGen(cell: Cell) {
        cell.currentGenerationFields = cell.nextGenerationFields as SimulationFields;
        cell.nextGenerationFields = {};
    }

    private calculateCellNextGen(cell: Cell) {
        const neighbors = this.cellNeighbors.get(cell);
        if (!neighbors) throw new Error("Invalid cell");
        const affectingNeighbors = this.getNeighborsAffectingWind(cell, neighbors);

        this.updateCellWind(cell, neighbors, affectingNeighbors);
        this.updateCellCloud(cell, neighbors, affectingNeighbors);
        this.updateCellTemp(cell, neighbors, affectingNeighbors);
        this.updateAirPollution(cell, neighbors, affectingNeighbors);
        this.updateArea(cell, neighbors, affectingNeighbors);
    }

    private updateArea(cell: Cell, _neighbors: Neighbors, _affectingNeighbors: Cell[]) {
        cell.nextGenerationFields.area = cell.currentGenerationFields.area;

        if (cell.currentGenerationFields.area == Area.Iceberg && cell.currentGenerationFields.temperature > 0) {
            cell.nextGenerationFields.area = Area.Sea;
        }
        // if this happens you probably messed something up in the config file
        if (cell.currentGenerationFields.area == Area.Sea && cell.currentGenerationFields.temperature > 100) {
            cell.nextGenerationFields.area = Area.Land;
        }
    }

    private updateAirPollution(cell: Cell, _neighbors: Neighbors, affectingNeighbors: Cell[]) {
        const currentPollution = cell.currentGenerationFields.airPollution;

        cell.nextGenerationFields.airPollution = currentPollution;
        if (cell.currentGenerationFields.area == Area.City) cell.nextGenerationFields.airPollution += config.CityPollutionPerGeneration;

        // for each incoming pollution, subtract the current pollution to get the delta, then multiply by the wind factor.
        // sum it all up to get the added pollution
        const incomingPollution = affectingNeighbors
            .map((neighbor) => (neighbor.currentGenerationFields.airPollution - currentPollution) * config.PollutionByWindPercent)
            .reduce((sum, currentPollution) => sum + currentPollution, 0);

        cell.nextGenerationFields.airPollution += incomingPollution;

        cell.nextGenerationFields.airPollution = clamp(cell.nextGenerationFields.airPollution, 0, 1);
    }

    private updateCellTemp(cell: Cell, neighbors: Neighbors, affectingNeighbors: Cell[]) {
        const currentTemperature = cell.currentGenerationFields.temperature;
        cell.nextGenerationFields.temperature = currentTemperature;
        cell.nextGenerationFields.temperature += cell.currentGenerationFields.airPollution * config.PollutionHeatRatio;

        // change temperature from neighbors with wind
        const incomingTemperatureWind = affectingNeighbors
            .map((neighbor) => (neighbor.currentGenerationFields.temperature - currentTemperature) * config.TemperatureByWindPercent)
            .reduce((sum, currentTemp) => sum + currentTemp, 0);
        
        cell.nextGenerationFields.temperature += incomingTemperatureWind;

        // get spread temperature from neighbors
        const neighborList = Object.values(neighbors);
        const effectiveBorderNeighbors = cell.currentGenerationFields.area !== Area.Iceberg // ice is only affected by neighboring ice cells
            ? neighborList
            : neighborList.filter((neighbor) => neighbor.currentGenerationFields.area === Area.Iceberg); 
        const incomingTemperatureLand = effectiveBorderNeighbors
            .map((neighbor) => (neighbor.currentGenerationFields.temperature - currentTemperature) * config.TemperatureByLandPercent)
            .reduce((sum, currentTemp) => sum + currentTemp, 0);
        cell.nextGenerationFields.temperature += incomingTemperatureLand;
        
        // subtract temperature spread to neighbors
        const averageNeighborTemp = getMean(effectiveBorderNeighbors.map((neighbor) => neighbor.currentGenerationFields.temperature));
        cell.nextGenerationFields.temperature -= (currentTemperature - averageNeighborTemp) * config.TemperatureByLandPercent;

        const cellCloud = cell.currentGenerationFields.cloud;
        if (!cellCloud) return;
        // TODO: maybe account for affecting neighboring cell's temperature? wind carries heat?
        if (cellCloud.timeToRain <= 0) {
            const delta = cell.nextGenerationFields.temperature - config.RainTemperature;
            cell.nextGenerationFields.temperature -= delta * config.RainTemperatureStepRatio;
        } else {
            const delta = cell.nextGenerationFields.temperature - config.CloudShadeMinTemperature;
            // in this simulation, clouds can cool an area but not warm it
            if (delta > 0) {
                cell.nextGenerationFields.temperature -= delta * config.CloudTemperatureStepRatio;
            }
        }
    }

    private updateCellCloud(cell: Cell, _neighbors: Neighbors, affectingNeighbors: Cell[]) {
        // Get clouds moving towards current cell
        const clouds = affectingNeighbors
            .map((neighbor) => neighbor.currentGenerationFields.cloud)
            .filter(Boolean) as CloudInfo[];

        if (cell.currentGenerationFields.windDirection == Direction.None && cell.currentGenerationFields.cloud) {
            // if the current cell has a cloud that won't move
            clouds.push(cell.currentGenerationFields.cloud);
        }

        if (clouds.length == 0) {
            cell.nextGenerationFields.cloud = tryCreateCloud(cell.currentGenerationFields.area);
            return;
        }

        cell.nextGenerationFields.cloud = joinClouds(clouds);
    }

    // wind is only updated according to neighbors, not including the actual cell
    private updateCellWind(cell: Cell, _neighbors: Neighbors, affectingNeighbors: Cell[]) {
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