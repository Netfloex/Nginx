const logger = import("@lib/logger");
// Lazy load because of circular dependency

export const parseIntDefault = (
	string: string | undefined,
	or: number
): number => {
	if (!string) return or;

	if (isNaN(parseInt(string))) {
		logger.then((l) => l.logger.parseIntFailed({ string, or }));
		return or;
	}
	return parseInt(string);
};
