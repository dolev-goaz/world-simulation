import { DirectionArrows, TDirection } from "./direction";

export type SimulationFields = {
    windDirection: TDirection;
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
            windDirection: windDirection
        },
        nextGenerationFields: {},
    }
}

export function drawCell(ctx: CanvasRenderingContext2D, cell: Cell) {
    drawOutline(ctx, cell);
    drawWind(ctx, cell);
}

function drawOutline(ctx: CanvasRenderingContext2D, cell: Cell) {
    ctx.strokeRect(cell.drawX, cell.drawY, cell.drawSize, cell.drawSize);
}

function drawWind(ctx: CanvasRenderingContext2D, cell: Cell) {
    const arrow = DirectionArrows[cell.currentGenerationFields.windDirection];

    const fontSize = 16;
    ctx.font = `${fontSize}px serif`;
    ctx.fillStyle = 'black';
    ctx.fillText(arrow, cell.drawX + 5, cell.drawY + fontSize);
}