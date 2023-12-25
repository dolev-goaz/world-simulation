export const Direction = {
    North: 'N',
    South: 'S',
    East: 'E',
    West: 'W',

    NorthEast: 'NE',
    NorthWest: 'NW',
    SouthEast: 'SE',
    SouthWest: 'SW',

    None: 'None',
} as const;

export type Vector2D = [number, number];

export const DirectionVectors = {
    [Direction.North]: [0, -1],
    [Direction.South]: [0, 1],
    [Direction.East]: [1, 0],
    [Direction.West]: [-1, 0],

    [Direction.NorthEast]: [1, -1],
    [Direction.NorthWest]: [-1, -1],
    [Direction.SouthEast]: [1, 1],
    [Direction.SouthWest]: [-1, 1],

    [Direction.None]: [0, 0],
} as Record<TDirection, Vector2D>;

export const DirectionArrows = {
    [Direction.North]: '↑',
    [Direction.South]: '↓',
    [Direction.East]: '→',
    [Direction.West]: '←',

    [Direction.NorthEast]: '↗',
    [Direction.NorthWest]: '↖',
    [Direction.SouthEast]: '↘',
    [Direction.SouthWest]: '↙',
    [Direction.None]: '',
} as const;

export type TDirection = (typeof Direction)[keyof typeof Direction];

export const Directions = [
    Direction.North,
    Direction.South,
    Direction.East,
    Direction.West,
    Direction.NorthEast,
    Direction.NorthWest,
    Direction.SouthEast,
    Direction.SouthWest,
] as const; // no cleaner way really

export function randomDirection() {
    const randomIndex = Math.floor(Math.random() * Directions.length);
    return Directions[randomIndex]
}

export function addVectors(vector1: Vector2D, vector2: Vector2D): Vector2D {
    return [
        vector1[0] + vector2[0],
        vector1[1] + vector2[1],
    ];
}

export function compareVectors(vector1: Vector2D, vector2: Vector2D): boolean {
    return vector1[0] == vector2[0] && vector1[1] == vector2[1];
}

export function getDirectionFromVector(vector: Vector2D): TDirection {
    for (const [key, value] of Object.entries(DirectionVectors)) {
        if (value[0] == vector[0] && value[1] == vector[1]) {
            return key as TDirection; // object entries typescript issue
        }
    }
    throw new Error("Invalid direction");
}