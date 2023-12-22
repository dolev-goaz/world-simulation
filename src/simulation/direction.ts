export const Direction = {
    North: 'N',
    South: 'S',
    East: 'E',
    West: 'W',
    
    NorthEast: 'NE',
    NorthWest: 'NW',
    SouthEast: 'SE',
    SouthWest: 'SW',
} as const;

export const DirectionVectors = {
    [Direction.North]: [0, 1],
    [Direction.South]: [0, -1],
    [Direction.East]: [1, 0],
    [Direction.West]: [-1, 0],
    
    [Direction.NorthEast]: [1, 1],
    [Direction.NorthWest]: [-1, 1],
    [Direction.SouthEast]: [1, -1],
    [Direction.SouthWest]: [-1, -1],
} satisfies Record<TDirection, [number, number]>;

export const DirectionArrows = {
    [Direction.North]: '↑',
    [Direction.South]: '↓',
    [Direction.East]: '→',
    [Direction.West]: '←',

    [Direction.NorthEast]: '↗',
    [Direction.NorthWest]: '↖',
    [Direction.SouthEast]: '↘',
    [Direction.SouthWest]: '↙',
} as const;

export type TDirection = (typeof Direction)[keyof typeof Direction];

export function randomDirection() {
    const indices = Object.keys(Direction) as Array<keyof typeof Direction>;
    
    const randomIndex = Math.floor(Math.random() * indices.length);
    return Direction[indices[randomIndex]];
}