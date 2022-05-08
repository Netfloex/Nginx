import { performance } from "perf_hooks";

/**
 * Formats the amount of time since a certain event
 * @param started Amount of milliseconds
 * @returns A string formatted for the amount of seconds
 */

export const startedToSeconds = (started: number): string =>
	((performance.now() - started) / 1000).toFixed(3);
