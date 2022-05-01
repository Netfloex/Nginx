import stringWidth from "string-width";

import settings from "@utils/settings";

/* 
	Returns the message and adds spaces so all messages have the same length
	if process.env.LOG_COLUMS
*/
export const fixedLength = (message: string, longestLength: number): string =>
	!settings.logFormatColumns
		? message
		: message + Array(longestLength + 1 - stringWidth(message)).join(" ");
