// Lazy load because of circular dependency
const logger = import("@lib/logger");

/**
 * Parses a string with a default value for when it can not be parsed
 * @param string The string to be parsed to an integer
 * @param or The default value
 * @returns An integer
 */

export const parseIntDefault = (
	string: string | undefined,
	or: number
): number => {
	if (!string) return or;
	const parsed = parseInt(string);

	if (isNaN(parsed)) {
		logger.then((l) => l.logger.parseIntFailed({ string, or }));
		return or;
	}
	return parsed;
};
