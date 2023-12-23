import { DirectionArrows, TDirection } from "./direction";

export type CloudInfo = {
    isRaining: boolean;
}

export type SimulationFields = {
    windDirection: TDirection;
    strokeColor: string;
    cloud?: CloudInfo;
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

export function createCell(indexX: number, indexY: number, drawSize: number, windDirection: TDirection): Cell {
    return {
        drawSize: drawSize,
        indexX: indexX,
        indexY: indexY,
        drawX: indexX * drawSize,
        drawY: indexY * drawSize,
        currentGenerationFields: {
            windDirection: windDirection,
            strokeColor: 'black',
            // TODO: determine how to initialize clouds
            cloud: { isRaining: false }
        },
        nextGenerationFields: {},
    }
}

export function drawCell(ctx: CanvasRenderingContext2D, cell: Cell) {
    drawOutline(ctx, cell);
    drawWind(ctx, cell);
    drawCloud(ctx, cell);
}

function drawOutline(ctx: CanvasRenderingContext2D, cell: Cell) {
    ctx.strokeStyle = cell.currentGenerationFields.strokeColor;
    ctx.strokeRect(cell.drawX, cell.drawY, cell.drawSize, cell.drawSize);
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
    const color = cloud.isRaining ? 'gray' : 'lightgray';


    const radX = 20;
    const radY = 10;
    const drawY = cell.drawY + cell.drawSize - radY - 4; // slight offset from below
    const drawX = cell.drawX + cell.drawSize / 2; // center
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(drawX, drawY, radX, radY, 0, 0, 2 * Math.PI);
    ctx.fill();
}