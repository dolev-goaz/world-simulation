import { AreaColor, TArea } from "./area";
import { DirectionArrows, TDirection } from "./direction";

const cellBorderThickness = 1;

const images = new Map<string, HTMLImageElement>();

export type CloudInfo = {
    lifeRemaining: number;

    // generations remaining until it starts raining
    timeToRain: number;
}

export type WindInfo = {
    direction: TDirection;
    force: number;
}

export type SimulationFields = {
    wind?: WindInfo;
    strokeColor: string;
    cloud?: CloudInfo;
    temperature: number;
    airPollution: number;
    area: TArea;
}

export type Cell = {
    indexX: number;
    indexY: number;
    drawX: number;
    drawY: number;
    drawSize: number;

    currentGenerationFields: SimulationFields;
    nextGenerationFields: Partial<SimulationFields>;

}

export function createCell(
    indexX: number,
    indexY: number,
    drawSize: number,
    wind: WindInfo,
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
        currentGenerationFields: {
            wind: wind,
            strokeColor: 'black',
            temperature: initialTemperature,
            airPollution: initialAirPollution,
            area: area
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

    ctx.fillStyle = AreaColor[cell.currentGenerationFields.area];
    ctx.fillRect(
        cell.drawX + cellBorderThickness,
        cell.drawY + cellBorderThickness,
        cell.drawSize - 2 * cellBorderThickness,
        cell.drawSize - 2 * cellBorderThickness
    );
}

function drawWind(ctx: CanvasRenderingContext2D, cell: Cell) {
    const wind = cell.currentGenerationFields.wind;
    if (!wind) return;
    const arrow = DirectionArrows[wind.direction];

    const fontSize = 16;
    ctx.font = `${fontSize}px serif`;
    ctx.fillStyle = 'black';
    ctx.fillText(arrow, cell.drawX + 5, cell.drawY + fontSize);
}

function drawCloud(ctx: CanvasRenderingContext2D, cell: Cell) {
    const cloud = cell.currentGenerationFields.cloud;
    if (!cloud) return;
    const raining = cloud.timeToRain <= 0;
    const src = raining ? 'cloud_rain.png' : 'cloud_normal.png';
    const image = getImage(src);

    const paddingX = 10;
    const width = cell.drawSize - 2 * paddingX;
    const height = (image.height / image.width) * width; // scale height to the new width
    const drawX = cell.drawX + paddingX;
    const drawY = cell.drawY + cell.drawSize - height - 2; // padding-y = 2

    ctx.drawImage(image, 0, 0 , image.width, image.height, drawX, drawY, width, height)
}

function getImage(src: string) {
    if (images.has(src)) return images.get(src)!;
    const image = new Image();
    image.src = src;
    images.set(src, image);

    return image;
}