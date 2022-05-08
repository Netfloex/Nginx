/**
 * Converts milliseconds to the amount of days
 * @param ms Milliseconds
 * @returns Amount of days
 */

export const msToDays = (ms: number): number =>
	Math.round(ms / 1000 / 60 / 60 / 24);
