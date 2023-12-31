import config from "@/config.json";

type fn<T extends any[] = []> = (...args: T) => void;
type ControlsData = {
    spreadSheetExport: fn;
    step: fn;
    onChangeSize: fn<[number]>;
}

export function setupControls(options: ControlsData) {
    createExport(options.spreadSheetExport);
    createLoopControls(options.step);
    createStepButton(options.step);
    createGridSizeControl(options.onChangeSize);
}

function createGridSizeControl(onChange: fn<[number]>) {
    const size = document.querySelector<HTMLInputElement>('input#grid-size')!;
    size.value = config.CellSize.Initial.toString();
    size.min = config.CellSize.Min.toString();
    size.max = config.CellSize.Max.toString();
    size.oninput = () => {
        onChange(parseInt(size.value));
    }
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
        if(autoYear.hasAttribute('data-active')) {
            autoYear.removeAttribute('data-active');
            autoYear.innerText = '1 Year';
            return;
        }
        checkbox.disabled = true;
        autoYear.setAttribute('data-active', '');
        autoYear.innerText = 'Stop';
        for (let day = 0; day < 365; ++day) {
            if (!autoYear.hasAttribute('data-active')) break;
            timePerFrame = 1000 / Number(slider.value);
            await sleep(timePerFrame)
            stepMethod();

        }
        autoYear.removeAttribute('data-active');
        autoYear.innerText = '1 Year';
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