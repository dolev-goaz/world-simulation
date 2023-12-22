import { Map } from "./map";
import config from "../config.json";

export class Simulation {
    map: Map;

    constructor() {
        this.map = new Map(config.CellsInRow, config.CellsInColumn, config.CellSize);
    }

    step() {
        this.map.draw();
    }
}