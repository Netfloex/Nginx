import { createHash as hash } from "crypto";

const createHash = (from: string): string => {
	return hash("md5").update(from, "utf-8").digest("hex");
};

export default createHash;
