/**
 * Checks if an object contains no values
 * @param object An object
 * @returns A boolean
 */

export const isObjectEmpty = (object: object): boolean =>
	Object.keys(object).length == 0;
