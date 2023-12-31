import { WorldMap } from "./worldMap";
import config from "../config.json";
import { Cell, CloudInfo, SimulationFields, createCell } from "./cell";
import { Direction, DirectionVectors, Directions, TDirection, Vector2D, addVectors, compareVectors } from "./direction";
import { Area, TArea } from "./area";
import { joinClouds, tryCreateCloud } from "./cloud";
import { clamp, getMean, getStandardDeviation } from "@/mathUtil";
import { combineWinds, createRandomWind } from "./wind";

type Neighbors = Record<Exclude<TDirection, 'None'>, Cell>;
type Statistic = {
    set: number[];
    mean: number;
    stdDeviation: number;
}
export type Statistics = {
    temperature: Statistic;
    airPollution: Statistic;
}

export class Simulation {
    map: WorldMap;
    cellNeighbors: Map<Cell, Neighbors>; // this is by reference so its fine

    generation: number;

    statistics: Statistics;
    private generationHeader: HTMLElement;

    constructor(areaMap: TArea[]) {
        this.generation = 0;
        this.generationHeader = document.querySelector("header#generation-header")!;
        this.updateHeader();

        const cells: Cell[] = areaMap.map((area, index) => {
            const indexX = index % config.CellsInColumn
            const indexY = (index - indexX) / config.CellsInRow;
            const temperature = config.InitialTemperatures[area];
            const pollution = config.StaticInitialPollution + config.InitialPollution[area];

            const wind = undefined;
            return createCell(indexX, indexY, wind, area, temperature, pollution);
        })
        this.map = new WorldMap(cells);

        this.cellNeighbors = new Map();
        this.map.cells.forEach((cell) => {
            this.cellNeighbors.set(cell, this.getNeighbors(cell));
        });

        this.statistics = this.initializeStatistics();
        this.calculateStatistics();
    }

    private updateHeader() {
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
        return {
            airPollution: { set: [], stdDeviation: 0, mean: 0, },
            temperature: { set: [], stdDeviation: 0, mean: 0, }
        }
    }

    private calculateStatistics() {
        const generationPollutions = this.map.cells.map((cell) => cell.currentGenerationFields.airPollution);
        const pollutionStatistic = this.statistics.airPollution;
        pollutionStatistic.set.push(getMean(generationPollutions));
        pollutionStatistic.mean = getMean(pollutionStatistic.set);
        pollutionStatistic.stdDeviation = getStandardDeviation(pollutionStatistic.set);

        const generationTemperatures = this.map.cells.map((cell) => cell.currentGenerationFields.temperature);
        const temperatureStatistic = this.statistics.temperature;
        temperatureStatistic.set.push(getMean(generationTemperatures));
        temperatureStatistic.mean = getMean(temperatureStatistic.set);
        temperatureStatistic.stdDeviation = getStandardDeviation(temperatureStatistic.set);

        // generation fields
        const generationPollutionMean = pollutionStatistic.set[pollutionStatistic.set.length - 1];
        const generationPollutionStdDeviation = getStandardDeviation(generationPollutions);

        const generationTemperatureMean = temperatureStatistic.set[temperatureStatistic.set.length - 1];
        const generationTemperatureStdDeviation = getStandardDeviation(generationTemperatures);

        const pollutionTexts = [
            `Generation Mean: ${(100 * generationPollutionMean).toFixed(1)}%`,
            `Generation Standard Deviation: ${(100 * generationPollutionStdDeviation).toFixed(1)}%`,
            `All Generations Mean: ${(100 * pollutionStatistic.mean).toFixed(1)}%`,
            `All Generations Standard Deviation: ${(100 * pollutionStatistic.stdDeviation).toFixed(1)}%`
        ];
        const temperatureTexts = [
            `Generation Mean: ${generationTemperatureMean.toFixed(1)}ºC`,
            `Generation Standard Deviation: ${generationTemperatureStdDeviation.toFixed(1)}ºC`,
            `All Generations Mean: ${temperatureStatistic.mean.toFixed(1)}ºC`,
            `All Generations Standard Deviation: ${temperatureStatistic.stdDeviation.toFixed(1)}ºC`,
        ];
        const pollutionText = pollutionTexts.map((text) => `\t${text}`).join('\n');
        const temperatureText = temperatureTexts.map((text) => `\t${text}`).join('\n');

        const statisticsContainer = document.querySelector<HTMLDivElement>('#statistics-container')!;
        statisticsContainer.hidden = false;
        const statisticsData = statisticsContainer.querySelector<HTMLParagraphElement>('p#statistics')!;
        statisticsData.innerText = `AirPollution:\n${pollutionText}\nTemperature:\n${temperatureText}`;
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

    private updateAirPollution(cell: Cell, neighbors: Neighbors, affectingNeighbors: Cell[]) {
        const currentPollution = cell.currentGenerationFields.airPollution;

        cell.nextGenerationFields.airPollution = currentPollution;
        cell.nextGenerationFields.airPollution += config.PollutionPerGeneration[cell.currentGenerationFields.area];

        // for each incoming pollution, subtract the current pollution to get the delta, then multiply by the wind factor.
        // sum it all up to get the added pollution
        const incomingPollutionWind = affectingNeighbors
            .map((neighbor) => (neighbor.currentGenerationFields.airPollution - currentPollution) * config.PollutionByWindPercent)
            .reduce((sum, currentPollution) => sum + currentPollution, 0);
        cell.nextGenerationFields.airPollution += incomingPollutionWind;

        const neighborList = Object.values(neighbors);
        const incomingPollutionLand = neighborList
            .map((neighbor) => (neighbor.currentGenerationFields.airPollution - currentPollution) * config.PollutionByLandPercent)
            .reduce((sum, currentPollution) => sum + currentPollution, 0);
        cell.nextGenerationFields.airPollution += incomingPollutionLand;

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
        // in this simulation, clouds can cool an area but not warm it
        if (cellCloud.timeToRain <= 0) {
            const delta = cell.nextGenerationFields.temperature - config.RainTemperature;
            if (delta > 0) {
                cell.nextGenerationFields.temperature -= delta * config.RainTemperatureStepRatio;
            }
        } else {
            const delta = cell.nextGenerationFields.temperature - config.CloudShadeMinTemperature;
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

        if (!cell.currentGenerationFields.wind && cell.currentGenerationFields.cloud) {
            // if the current cell has a cloud that won't move(no wind)
            clouds.push(cell.currentGenerationFields.cloud);
        }

        if (clouds.length == 0) {
            cell.nextGenerationFields.cloud = tryCreateCloud(cell.currentGenerationFields.area);
            return;
        }

        cell.nextGenerationFields.cloud = joinClouds(clouds);
    }

    // wind is only updated according to neighbors, not including the actual cell
    private updateCellWind(cell: Cell, neighbors: Neighbors, affectingNeighbors: Cell[]) {
        // this is for debugging mostly- show which cells are affected by wind
        // if (affectingNeighbors.length != 0) cell.currentGenerationFields.strokeColor = 'red';

        // affecting neighbors must have wind
        const newWindInfo = combineWinds(affectingNeighbors.map((neighbor) => neighbor.currentGenerationFields.wind!));

        // reduce wind force by 1 each generation. if its 1 or less, it will be 0 so the wind dies out.
        if (newWindInfo && newWindInfo.force > 1) {
            newWindInfo.force -= 1;
            cell.nextGenerationFields.wind = newWindInfo;
        }

        if (!cell.nextGenerationFields.wind) {
            if (Math.random() < config.Wind.CreateChance) {
                const direction = this.findWarmestNeighbor(neighbors)[0];
                cell.nextGenerationFields.wind = createRandomWind(direction);
            }
        }
    }

    private findWarmestNeighbor(neighbors: Neighbors) {
        const pairs = Object.entries(neighbors) as Array<[TDirection, Cell]>;
        return pairs
            .reduce(([warmestDirection, warmestCell], [currDirection, currCell]) => {
                if (currCell.currentGenerationFields.temperature > warmestCell.currentGenerationFields.temperature)
                    return [currDirection, currCell];
                return [warmestDirection, warmestCell];
            })
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

            if (!neighborInDirection.currentGenerationFields.wind) return;
            const neighborDirectionVector = DirectionVectors[direction];
            const neighborWindDirectionVector = DirectionVectors[neighborInDirection.currentGenerationFields.wind.direction];

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