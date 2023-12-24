import { Simulation } from "./simulation/simulation";
import config from "./config.json"
import { TArea } from "./simulation/area";

const areaMap = config.Map1.split('\n').map((line) => line.split('')).flat() as TArea[];
const simulation = new Simulation(areaMap);

function step() {
    // // use this to show next step info
    // simulation.calcNextGen();
    // simulation.map.draw();
    // simulation.moveNextGen();
    simulation.calcNextGen();
    simulation.moveNextGen();
    simulation.map.draw();
}
const button = document.createElement("button");
button.innerText = "Step"
button.onclick = step;
document.body.appendChild(button)

for (let i = 0; i < config.StepCount - 1; ++i) {
    step();
    await sleep(400)
}
step();

function sleep(time: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}