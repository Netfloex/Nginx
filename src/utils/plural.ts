/**
 * Adds an 's' if the number is not equal to 0
 * @param count The amount
 * @returns 's' or ''
 */

export const plural = (count: number): "" | "s" => (count != 1 ? "s" : "");
