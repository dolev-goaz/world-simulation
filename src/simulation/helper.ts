export function randomRange(min: number, max: number) {
    const inRange = Math.random() * (max - min + 1) + min;
    return Math.floor(inRange);
}

export type ObjectReversed<T extends object> = Prettier<{
    [TKey in keyof T as T[TKey] & string]: TKey
}>;

type Prettier<T> = T extends object? {
    [TKey in keyof T]: Prettier<T[TKey]>;
}: T