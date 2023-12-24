export type ObjectReversed<T extends object> = Prettier<{
    [TKey in keyof T as T[TKey] & string]: TKey
}>;

type Prettier<T> = T extends object? {
    [TKey in keyof T]: Prettier<T[TKey]>;
}: T