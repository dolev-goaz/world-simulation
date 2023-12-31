import { AreaColor, TArea } from "./area";
import { DirectionArrows } from "./direction";
import { WindInfo } from "./wind";

const cellBorderThickness = 1;

const images = new Map<string, HTMLImageElement>();

type DrawData = {
    drawX: number;
    drawY: number;
    drawSize: number;
};

export type CloudInfo = {
    lifeRemaining: number;

    // generations remaining until it starts raining
    timeToRain: number;
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

    currentGenerationFields: SimulationFields;
    nextGenerationFields: Partial<SimulationFields>;

}

export function createCell(
    indexX: number,
    indexY: number,
    wind: WindInfo | undefined,
    area: TArea,
    initialTemperature: number,
    initialAirPollution: number,
): Cell {
    return {
        indexX: indexX,
        indexY: indexY,
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

export function drawCell(ctx: CanvasRenderingContext2D, cell: Cell, cellSize: number) {
    const drawData: DrawData = {
        drawX: cellSize * cell.indexX,
        drawY: cellSize * cell.indexY,
        drawSize: cellSize
    };
    drawArea(ctx, cell, drawData);
    drawWind(ctx, cell, drawData);
    drawCloud(ctx, cell, drawData);
    drawTemperature(ctx, cell, drawData);
}

function drawArea(ctx: CanvasRenderingContext2D, cell: Cell, drawData: DrawData) {
    ctx.strokeStyle = cell.currentGenerationFields.strokeColor;
    ctx.strokeRect(drawData.drawX, drawData.drawY, drawData.drawSize, drawData.drawSize);

    ctx.fillStyle = AreaColor[cell.currentGenerationFields.area];
    ctx.fillRect(
        drawData.drawX + cellBorderThickness,
        drawData.drawY + cellBorderThickness,
        drawData.drawSize - 2 * cellBorderThickness,
        drawData.drawSize - 2 * cellBorderThickness
    );
}

function drawWind(ctx: CanvasRenderingContext2D, cell: Cell, drawData: DrawData) {
    const wind = cell.currentGenerationFields.wind;
    if (!wind) return;
    const arrow = DirectionArrows[wind.direction];

    const fontSize = drawData.drawSize / 4;
    ctx.font = `${fontSize}px serif`;
    ctx.strokeStyle = 'black';
    ctx.strokeText(arrow, drawData.drawX + 5, drawData.drawY + fontSize, fontSize);
}

function drawCloud(ctx: CanvasRenderingContext2D, cell: Cell, drawData: DrawData) {
    const cloud = cell.currentGenerationFields.cloud;
    if (!cloud) return;
    const raining = cloud.timeToRain <= 0;
    const src = raining ? 'cloud_rain.png' : 'cloud_normal.png';
    const image = getImage(src);

    const paddingX = 10;
    const width = drawData.drawSize - 2 * paddingX;
    const height = (image.height / image.width) * width; // scale height to the new width
    const drawX = drawData.drawX + paddingX;
    const drawY = drawData.drawY + drawData.drawSize - height - 2; // padding-y = 2

    ctx.drawImage(image, 0, 0 , image.width, image.height, drawX, drawY, width, height)
}

function getImage(src: string) {
    if (images.has(src)) return images.get(src)!;
    const image = new Image();
    image.src = src;
    images.set(src, image);

    return image;
}

function drawTemperature(ctx: CanvasRenderingContext2D, cell: Cell, drawData: DrawData) {
    const fontSize = drawData.drawSize / 4;
    ctx.font = `${fontSize}px serif`;
    ctx.fillStyle = 'black';
    const temperature = cell.currentGenerationFields.temperature.toFixed(0);
    const temperatureText = `${temperature}ºC`;
    const drawX = drawData.drawX + drawData.drawSize / 2.6;
    const drawY = drawData.drawY;
    ctx.strokeText(temperatureText, drawX, drawY + fontSize);
}
