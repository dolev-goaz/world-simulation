import { Simulation } from "./simulation/simulation";
import config from "./config.json"
import { AreaShortReversed, TArea } from "./simulation/area";

const areaMap = config.Maps[0]
    .split('\n')
    .map((line) => line.split(''))
    .flat()
    .map((areaShort) => AreaShortReversed[areaShort as keyof typeof AreaShortReversed]) as TArea[];
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


setupControls();
simulation.map.draw();

function createLoopControls() {
    const initialSliderValue = 2;
    let timePerFrame = 1000 / initialSliderValue;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.title = 'auto step';
    let loopInterval: NodeJS.Timeout;
    checkbox.oninput = () => {
        if (!checkbox.checked) return;

        step();
        loopInterval = setInterval(() => {
            if (!checkbox.checked) {
                clearInterval(loopInterval);
                return;
            }
            step();
        }, timePerFrame);
    }

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '1';
    slider.max = '100'
    slider.step = '1';
    slider.value = initialSliderValue.toString();
    slider.title = `steps per second- ${slider.value}`;

    slider.oninput = () => {
        timePerFrame = 1000 / Number(slider.value);
        slider.title = `steps per second- ${slider.value}`;
        clearInterval(loopInterval);
        loopInterval = setInterval(() => {
            if (!checkbox.checked) {
                clearInterval(loopInterval);
                return;
            }
            step();
        }, timePerFrame);

    }
    return { slider, checkbox }
}

function createStepButton() {
    const button = document.createElement("button");
    button.innerText = "Step"
    button.onclick = step;
    return button;
}

function setupControls() {
    const stepButton = createStepButton();
    const loopControls = createLoopControls();

    const loopContainer = document.createElement('div');
    loopContainer.appendChild(loopControls.checkbox);
    loopContainer.appendChild(loopControls.slider);

    const controlsContainer = document.createElement('div');
    controlsContainer.classList.add('controls')
    controlsContainer.appendChild(stepButton);
    controlsContainer.appendChild(loopContainer);
    document.body.appendChild(controlsContainer);
}