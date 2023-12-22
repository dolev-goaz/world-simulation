import { Simulation } from "./simulation/simulation";
import config from "./config.json";

const simulation = new Simulation();


for (let i = 0; i < config.StepCount; i++) {
    simulation.step();
}