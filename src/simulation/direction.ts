export const Direction = {
    North: 'N',
    South: 'S',
    East: 'E',
    West: 'W',
} as const;

export const DirectionArrows = {
    [Direction.North]: '↑',
    [Direction.South]: '↓',
    [Direction.East]: '→',
    [Direction.West]: '←',
} as const;

export type TDirection = (typeof Direction)[keyof typeof Direction];

export function randomDirection() {
    const indices = Object.keys(Direction) as Array<keyof typeof Direction>;
    
    const randomIndex = Math.floor(Math.random() * indices.length);
    return Direction[indices[randomIndex]];
}