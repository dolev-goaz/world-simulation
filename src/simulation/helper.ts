export function randomRange(min: number, max: number) {
    const inRange = Math.random() * (max - min + 1) + min;
    return Math.floor(inRange);
}