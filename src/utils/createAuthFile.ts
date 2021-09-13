import md5 from "apache-md5";
import { outputFile, pathExists } from "fs-extra";
import { join } from "path";

import createHash from "@utils/createHash";
import { authPath } from "@utils/env";

import { Auth } from "@models/ParsedConfig";

const htpasswd = ({ username, password }: Auth): string =>
	`${username}:${md5(password)}`;

const createAuthFile = async (
	users: Auth[]
): Promise<{ filename: string; hash: string }> => {
	const hash = createHash(JSON.stringify(users));
	const filename = join(authPath, hash);

	if (!(await pathExists(filename))) {
		const content = users.map(htpasswd).join("\n");

		await outputFile(filename, content);
	}

	return { filename, hash };
};

export default createAuthFile;
