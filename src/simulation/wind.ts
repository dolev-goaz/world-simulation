import { clamp, randomRange } from "@/mathUtil";
import { DirectionVectors, TDirection, Vector2D, compareVectors, getDirectionFromVector, randomDirection } from "./direction";
import config from "../config.json";

export type WindInfo = {
    direction: TDirection;
    force: number;
}

export function combineWinds(winds: WindInfo[]): WindInfo | undefined {
    const outVector = sumWindsToVector(winds);
    return vectorToWindInfo(outVector);
}

export function createRandomWind(direction?: TDirection): WindInfo | undefined {
    const force = randomRange(config.Wind.InitialForce.Min, config.Wind.InitialForce.Max);
    if (force == 0) return undefined;

    const windDirection = direction ?? randomDirection();

    return {
        direction: windDirection,
        force: force
    }
}

function vectorToWindInfo(vector: Vector2D): WindInfo | undefined {
    if (compareVectors(vector, DirectionVectors.None)) return undefined;

    const absForces =
        vector
            .filter((directionalForce) => directionalForce != 0)
            .map(Math.abs);

    const minForce = Math.min(...absForces);


    const normalizedVector = vector.map((force) => clamp(force, -1, 1)) as Vector2D;
    return {
        direction: getDirectionFromVector(normalizedVector),
        force: minForce,
    };
}

function sumWindsToVector(winds: WindInfo[]) {
    return winds.reduce((total, wind) => {
        const vector = DirectionVectors[wind.direction];
        total[0] += vector[0] * wind.force;
        total[1] += vector[1] * wind.force;
        return total;
    }, [0, 0] as Vector2D);
}
