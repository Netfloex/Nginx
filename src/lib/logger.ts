import chalk from "chalk";
import { performance } from "perf_hooks";
import stringWidth from "string-width";

import { logMessages } from "@lib/logMessages";
import { fixedLength } from "@utils/fixedLength";
import settings from "@utils/settings";
import { startedToSeconds } from "@utils/startedToSeconds";

export enum Log {
	log,
	info,
	warn,
	done,
	error
}

export enum Tag {
	main,
	certbot,
	dhParams,
	config,
	css,
	js,
	cloudflare,
	env,
	nginx,
	dns
}

const TagList: Record<Tag, string> = {
	"0": "",
	"1": chalk`[{green CERTBOT}]`,
	"2": chalk`[{yellow DHPARAMS}]`,
	"3": chalk`[{cyan CONFIG}]`,
	"4": chalk`[{blue CSS}]`,
	"5": chalk`[{yellow JS}]`,
	"6": chalk`[{hex("#FF8800") CLOUDFLARE}]`,
	"7": chalk`[{blue ENV}]`,
	"8": chalk`[{green NGINX}]`,
	"9": chalk`[{red DNS}]`
};

const TypeList: Record<Log, string> = {
	"0": "",
	"1": chalk`[{yellow INFO}]`,
	"2": chalk`[{red WARN}]`,
	"3": chalk`[{green DONE}]`,
	"4": chalk`[{red ERROR}]`
};

/* 
	Compute the longest visible length of the values in an object
*/

const longestLengthValue = (obj: Record<string, string>): number =>
	Math.max(...Object.values(obj).map((val) => stringWidth(val)));

const longestTagLength = longestLengthValue(TagList);
const longestTypeLength = longestLengthValue(TypeList);

export const started = performance.now();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createLogFunction = <Key extends keyof typeof logMessages>(key: Key) => {
	return (...args: Parameters<typeof logMessages[Key]>): void => {
		const [logType, logTag, message] = logMessages[key](
			...(args as [never])
		);

		const type = fixedLength(TypeList[logType], longestTypeLength);
		const tag = fixedLength(TagList[logTag], longestTagLength);

		const logCall = logger.overWriteLogFunction
			? logger.overWriteLogFunction
			: logType == Log.error
			? console.error
			: logType == Log.warn
			? console.warn
			: console.log;

		logCall(
			[
				settings.logShowTime &&
					chalk`{dim ${startedToSeconds(started)}s}`,
				settings.logShowName && chalk`[{blue NCM}]`,
				type,
				settings.logShowTag && tag,
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
