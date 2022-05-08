import md5 from "apache-md5";
import { outputFile, pathExists } from "fs-extra";
import { join } from "path";

import { createHash } from "@utils/createHash";
import settings from "@utils/settings";

import { Auth } from "@models/ParsedConfig";

/**
 * Creates a htpasswd string from a username and password
 * @param {Auth} Auth Object
 * @returns
 */

export const htpasswd = ({ username, password }: Auth): string =>
	`${username}:${md5(password)}`;

/**
 * Creates an htpasswd file in `settings.authPath`
 * The name of the file is a hash of the contents
 * @param users an array of {@link Auth} objects
 * @returns {object} An object containing the filepath and the hash
 */

export const createAuthFile = async (
	users: Auth[]
): Promise<{ filepath: string; hash: string }> => {
	const hash = createHash(JSON.stringify(users));
	const filepath = join(settings.authPath, hash);

	if (!(await pathExists(filepath))) {
		const content = users.map(htpasswd).join("\n");

		await outputFile(filepath, content);
	}

	return { filepath, hash };
};
