import stringWidth from "string-width";

import settings from "@utils/settings";

/* 
	Returns the message and adds spaces so all messages have the same length
	Disabled if process.env.LOG_FORMAT_COLUMS is enabled
	If longestLength is lower than the message length, don't add spaces
	Or don't create an array with a negative length
*/

export const fixedLength = (message: string, longestLength: number): string =>
	!settings.logFormatColumns
		? message
		: message +
		  Array(Math.max(0, longestLength + 1 - stringWidth(message))).join(
				" "
		  );
