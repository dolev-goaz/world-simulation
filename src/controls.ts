type fn = () => void;
type ControlsData = {
    spreadSheetExport: fn;
    step: fn;
}

export function setupControls(options: ControlsData) {
    createExport(options.spreadSheetExport);
    createLoopControls(options.step);
    createStepButton(options.step);
}

function createExport(exportMethod: fn) {
    const button = document.querySelector<HTMLButtonElement>('button#export-excel')
    if (!button) return;
    button.onclick = exportMethod;
}

function createLoopControls(stepMethod: fn) {
    const initialSliderValue = 2;
    let timePerFrame = 1000 / initialSliderValue;

    const checkbox = document.querySelector<HTMLInputElement>("input[type=checkbox]#auto-step")!;
    const autoYear = document.querySelector<HTMLButtonElement>('button#auto-step-year')!;
    const slider = document.querySelector<HTMLInputElement>("input[type=range]#auto-step-speed")!;
    const sliderLabel = document.querySelector<HTMLLabelElement>('[for=auto-step-speed]')!;

    let loopInterval: NodeJS.Timeout;
    checkbox.oninput = () => {
        autoYear.disabled = checkbox.checked;
        if (!checkbox.checked) return;

        stepMethod();
        loopInterval = setInterval(() => {
            if (!checkbox.checked) {
                clearInterval(loopInterval);
                return;
            }
            stepMethod();
        }, timePerFrame);
    };
    slider.min = "1";
    slider.max = "100";
    slider.step = "1";
    slider.value = initialSliderValue.toString();
    slider.title = `generations per second- ${slider.value}`;
    sliderLabel.innerText = `generations per second- ${slider.value}`;

    slider.oninput = () => {
        timePerFrame = 1000 / Number(slider.value);
        slider.title = `generations per second- ${slider.value}`;
        sliderLabel.innerText = `generations per second- ${slider.value}`;
        clearInterval(loopInterval);
        loopInterval = setInterval(() => {
            if (!checkbox.checked) {
                clearInterval(loopInterval);
                return;
            }
            stepMethod();
        }, timePerFrame);
    };

    autoYear.onclick = async () => {
        checkbox.disabled = true;
        autoYear.disabled = true;
        for (let day = 0; day < 365; ++day) {
            timePerFrame = 1000 / Number(slider.value);
            await sleep(timePerFrame)
            stepMethod();

        }
        autoYear.disabled = false;
        checkbox.disabled = false;
    }
}

function createStepButton(stepMethod: fn) {
    const button = document.querySelector<HTMLInputElement>("button[type=button]#step")!;
    button.onclick = stepMethod;
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}