import { createHash as hash } from "crypto";

/**
 * Creates a md5 hash of the provided string
 * @param from The string to be hashed
 * @returns md5 hash of the string
 */

export const createHash = (from: string): string => {
	return hash("md5").update(from, "utf-8").digest("hex");
};
