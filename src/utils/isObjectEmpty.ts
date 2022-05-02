export const isObjectEmpty = (object: Record<string, unknown>): boolean =>
	Object.keys(object).length == 0;
