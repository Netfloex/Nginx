import { performance } from "perf_hooks";

export const startedToSeconds = (started: number): string =>
	((performance.now() - started) / 1000).toFixed(3);
