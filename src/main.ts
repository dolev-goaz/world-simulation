import { Simulation } from "./simulation/simulation";
import config from "./config.json";
import { AreaShortReversed, TArea } from "./simulation/area";
import { setupControls } from "./controls";
import { writeSpreadSheet } from "./spreadsheet";

const simulation = createSimulation();

function step() {
  simulation.calcNextGen();
  simulation.moveNextGen();
  simulation.map.draw();
}
function exportSimulationData() {
  writeSpreadSheet(simulation.statistics, 'export_simulation');
}
function updateMapSize(cellSize: number) {
  simulation.map.setCellSizeMultiplier(cellSize);
  simulation.map.draw();
}
setupControls({
  spreadSheetExport: exportSimulationData,
  step: step,
  onChangeSize: updateMapSize
});

simulation.map.draw();

function createSimulation() {
  const areaMap = config.Maps[0]
    .split("\n")
    .map((line) => line.split(""))
    .flat()
    .map(
      (areaShort) =>
        AreaShortReversed[areaShort as keyof typeof AreaShortReversed]
    ) as TArea[];
  return new Simulation(areaMap);
}