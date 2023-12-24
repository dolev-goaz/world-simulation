export function randomRange(min: number, max: number) {
    const inRange = Math.random() * (max - min + 1) + min;
    return Math.floor(inRange);
}
export function clamp(num: number, min: number, max: number) {
    return Math.min(Math.max(num, min), max);
}
export function getSum(set: number[]) {
    return set.reduce((total, current) => total + current, 0);
}

export function getMean(set: number[]) {
    if (set.length == 0) return 0;
    return getSum(set) / set.length;
}
export function getStandardDeviation(set: number[]) {
    if (set.length == 0) return 0;
    const mean = getMean(set);
    return Math.sqrt(
        getSum(
            set.map((x) => Math.pow(x - mean, 2))
        ) / set.length
    )
}