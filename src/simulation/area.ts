export const Area = {
    Forest: "F",
    City: "C",
    Sea: "S",
    Land: "L",
    Iceberg: "I",
} as const;

export const AreaColor = {
    [Area.Forest]: "#009900",
    [Area.City]: "#A0A0A0",
    [Area.Sea]: "#3399FF",
    [Area.Land]: "#994C00",
    [Area.Iceberg]: "#CCFFFF",
} as const;

export type TArea = (typeof Area)[keyof typeof Area];