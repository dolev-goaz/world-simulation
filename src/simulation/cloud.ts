import { randomRange } from "@/mathUtil";
import config from "../config.json";
import { Area, TArea } from "./area";

export type CloudInfo = {
    lifeRemaining: number;

    // generations remaining until it starts raining
    timeToRain: number;
}

export function tryCreateCloud(area: TArea): CloudInfo | undefined {
    let cloud: CloudInfo | undefined = undefined;
    // try to create new cloud
    if (area == Area.Sea) {
        const randomChance = Math.random();
        if (randomChance < config.Cloud.FormChance.Sea) {
            const lifespan = randomRange(config.Cloud.Lifespan.Min, config.Cloud.Lifespan.Max);
            const timeToRain = randomRange(1, lifespan - 1);
            cloud = {
                timeToRain: timeToRain,
                lifeRemaining: lifespan,
            };
        }
    }
    return cloud;
}

export function joinClouds(clouds: CloudInfo[]): CloudInfo | undefined {
    const localClouds = [...clouds];
    // if one of the clouds are raining- all of them are raining
    localClouds.sort((cloudA, cloudB) => cloudB.lifeRemaining - cloudA.lifeRemaining);

    // lifespan is the average of the cloud's lifespan.
    const lifespan = (clouds[0].lifeRemaining + clouds[clouds.length - 1].lifeRemaining) / 2 - 1;

    if (lifespan <= 0) return undefined;

    // if any cloud is raning- the new cloud is rainy
    const timeToRain = Math.min(...clouds.map((cloud) => cloud.timeToRain)) - 1;
    return {
        lifeRemaining: lifespan,
        timeToRain: timeToRain,
    }
}