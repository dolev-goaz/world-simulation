import { Simulation } from "./simulation/simulation";
import config from "./config.json"


const simulation = new Simulation();
function step() {
    simulation.calcNextGen();
    simulation.map.draw();
    simulation.moveNextGen();
}
const button = document.createElement("button");
button.innerText = "Step"
button.onclick = step;
document.body.appendChild(button)

for (let i = 0; i < config.StepCount - 1; ++i) {
    step();
    await sleep(800)
}
button.click();

function sleep(time: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}