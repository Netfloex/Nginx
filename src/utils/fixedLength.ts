import stringWidth from "string-width";

import settings from "@utils/settings";

/**
 * Returns the message and adds spaces so all messages have the same length
 * Disabled if process.env.LOG_FORMAT_COLUMS is enabled
 * @param message The message
 * @param longestLength Length of the new string
 * @returns The message with spaces until the length equals `longestLength`
 */

export const fixedLength = (message: string, longestLength: number): string => {
	if (settings.logFormatColumns) {
		// The difference in length
		const spacesToAdd = longestLength - stringWidth(message);

		// Ensure the count is at least 0
		const count = Math.max(0, spacesToAdd);

		return message + " ".repeat(count);
	}
	return message;
};
