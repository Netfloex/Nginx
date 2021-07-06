import { createHash as hash } from "crypto";

const createHash = (from: string): string => {
	const md5 = hash("md5");

	md5.update(from, "utf8");
	return md5.digest("hex");
};
export default createHash;
