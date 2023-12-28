import { Simulation } from "./simulation/simulation";
import * as ExcelJS from "exceljs";
import * as FileSaver from "file-saver";
import config from "./config.json";
import { AreaShortReversed, TArea } from "./simulation/area";

async function writeSpreadSheet() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("test");
  worksheet.columns = [{ header: "Test Header", key: "test" }];
  worksheet.addRow({ test: 5 });

  const buffer = await workbook.xlsx.writeBuffer();
  FileSaver.saveAs(new Blob([buffer]), "simulation_export.xlsx");
}

const areaMap = config.Maps[0]
  .split("\n")
  .map((line) => line.split(""))
  .flat()
  .map(
    (areaShort) =>
      AreaShortReversed[areaShort as keyof typeof AreaShortReversed]
  ) as TArea[];
setupControls();
const simulation = new Simulation(areaMap);

function step() {
  simulation.calcNextGen();
  simulation.moveNextGen();
  simulation.map.draw();
}

simulation.map.draw();

function setupControls() {
  createExport();
  createLoopControls();
  createStepButton();
}

function createExport() {
  const button = document.querySelector<HTMLButtonElement>('button#export-excel')
  if (!button) return;
  button.onclick = writeSpreadSheet;
}

function createLoopControls() {
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

    step();
    loopInterval = setInterval(() => {
      if (!checkbox.checked) {
        clearInterval(loopInterval);
        return;
      }
      step();
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
      step();
    }, timePerFrame);
  };

  autoYear.onclick = async () => {
    checkbox.disabled = true;
    autoYear.disabled = true;
    for (let day = 0; day < 365; ++day) {
      timePerFrame = 1000 / Number(slider.value);
      await sleep(timePerFrame)
      step();
      
    }
    autoYear.disabled = false;
    checkbox.disabled = false;
  }
}

function createStepButton() {
  const button = document.querySelector<HTMLInputElement>("button[type=button]#step")!;
  button.onclick = step;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}