export type Cell = {
    indexX: number;
    indexY: number;
    drawX: number;
    drawY: number;
    drawSize: number;
}

export function createCell(indexX: number, indexY: number, drawSize: number): Cell {
    return {
        drawSize: drawSize,
        indexX: indexX,
        indexY: indexY,
        drawX: indexX * drawSize,
        drawY: indexY * drawSize
    }
}

export function drawCell(ctx: CanvasRenderingContext2D , cell: Cell) {
    ctx.strokeRect(cell.drawX, cell.drawY, cell.drawSize, cell.drawSize);
}