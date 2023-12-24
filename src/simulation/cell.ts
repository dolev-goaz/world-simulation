import { AreaColor, TArea } from "./area";
import { DirectionArrows, TDirection } from "./direction";

const cellBorderThickness = 1;

export type CloudInfo = {
    lifeRemaining: number;

    // generations remaining until it starts raining
    timeToRain: number;
}

export type SimulationFields = {
    windDirection: TDirection;
    strokeColor: string;
    cloud?: CloudInfo;
    temperature: number;
    airPollution: number;
}

export type Cell = {
    indexX: number;
    indexY: number;
    drawX: number;
    drawY: number;
    drawSize: number;

    area: TArea;

    currentGenerationFields: SimulationFields;
    nextGenerationFields: Partial<SimulationFields>;

}

export function createCell(
    indexX: number,
    indexY: number,
    drawSize: number,
    windDirection: TDirection,
    area: TArea,
    initialTemperature: number,
    initialAirPollution: number,
): Cell {
    return {
        drawSize: drawSize,
        indexX: indexX,
        indexY: indexY,
        drawX: indexX * drawSize,
        drawY: indexY * drawSize,
        area: area,
        currentGenerationFields: {
            windDirection: windDirection,
            strokeColor: 'black',
            temperature: initialTemperature,
            airPollution: initialAirPollution,
        },
        nextGenerationFields: {},
    }
}

export function drawCell(ctx: CanvasRenderingContext2D, cell: Cell) {
    DrawArea(ctx, cell);
    drawWind(ctx, cell);
    drawCloud(ctx, cell);
}

function DrawArea(ctx: CanvasRenderingContext2D, cell: Cell) {
    ctx.strokeStyle = cell.currentGenerationFields.strokeColor;
    ctx.strokeRect(cell.drawX, cell.drawY, cell.drawSize, cell.drawSize);

    ctx.fillStyle = AreaColor[cell.area];
    ctx.fillRect(
        cell.drawX + cellBorderThickness,
        cell.drawY + cellBorderThickness,
        cell.drawSize - 2 * cellBorderThickness,
        cell.drawSize - 2 * cellBorderThickness
    );
}

function drawWind(ctx: CanvasRenderingContext2D, cell: Cell) {
    const arrow = DirectionArrows[cell.currentGenerationFields.windDirection];

    const fontSize = 16;
    ctx.font = `${fontSize}px serif`;
    ctx.fillStyle = 'black';
    ctx.fillText(arrow, cell.drawX + 5, cell.drawY + fontSize);
}

function drawCloud(ctx: CanvasRenderingContext2D, cell: Cell) {
    const cloud = cell.currentGenerationFields.cloud;
    if (!cloud) return;
    const raining = cloud.timeToRain <= 0;
    const image = new Image();
    image.src = raining ? 'cloud_rain.png' : 'cloud_normal.png';

    const paddingX = 10;
    const width = cell.drawSize - 2 * paddingX;
    const height = (image.height / image.width) * width; // scale height to the new width
    const drawX = cell.drawX + paddingX;
    const drawY = cell.drawY + cell.drawSize - height - 2; // padding-y = 2

    ctx.drawImage(image, 0, 0 , image.width, image.height, drawX, drawY, width, height)
}