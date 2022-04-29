import chalk from "chalk";
import { performance } from "perf_hooks";

import { logMessages } from "@lib/logMessages";
import { startedToSeconds } from "@utils/startedToSeconds";

export enum Log {
	info,
	warn,
	done,
	error,
	log
}

export enum Tag {
	main,
	certbot,
	dhParams,
	config,
	css,
	js,
	cloudflare,
	env
}
const TagList: Record<Tag, string> = {
	"0": "",
	"1": chalk`[{green CERTBOT}]`,
	"2": chalk`[{yellow DHPARAMS}]`,
	"3": chalk`[{cyan CONFIG}]`,
	"4": chalk`[{blue CSS}]`,
	"5": chalk`[{yellow JS}]`,
	"6": chalk`[{hex("#FF8800") CLOUDFLARE}]`,
	"7": chalk`[{blue ENV}]`
};
export const started = performance.now();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createLogFunction = <Key extends keyof typeof logMessages>(key: Key) => {
	return (...args: Parameters<typeof logMessages[Key]>): void => {
		const [logType, logTag, message] = logMessages[key](
			...(args as [never])
		);
		const type =
			logType == Log.info
				? chalk`[{yellow INFO}]`
				: logType == Log.warn
				? chalk`[{red WARN}]`
				: logType == Log.done
				? chalk`[{green DONE}]`
				: logType == Log.error
				? chalk`[{red ERROR}]`
				: "";
		const tag = TagList[logTag];

		const logCall = logger.overWriteLogFunction
			? logger.overWriteLogFunction
			: logType == Log.error
			? console.error
			: logType == Log.warn
			? console.warn
			: console.log;

		logCall(
			[
				!logger.disableTime &&
					chalk`{dim ${startedToSeconds(started)}s}`,
				chalk`[{blue NCM}]`,
				tag,
				type,
				message
			]
				.filter(Boolean)
				.join(" ")
		);
	};
};

type Logger = {
	[key in keyof typeof logMessages]: (
		...parameters: Parameters<typeof logMessages[key]>
	) => void;
} & {
	overWriteLogFunction?: (message: string) => void;
	disableTime?: true;
};

export const logger: Logger = (
	Object.keys(logMessages) as [keyof typeof logMessages]
).reduce(
	(prev, key) => ({
		...prev,
		[key]: createLogFunction(key)
	}),
	{} as Logger
);
