import { Simulation } from "./simulation/simulation";
import config from "./config.json";

const simulation = new Simulation();

let iteration = 0;
do {
    simulation.map.draw();
    simulation.step();
    await sleep(1000);
    ++iteration;
} while (iteration < config.StepCount);

function sleep(time: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}