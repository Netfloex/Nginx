import { outputFile, pathExists } from "fs-extra";
import { join } from "path";

import { createHash } from "@utils/createHash";
import { htpasswd } from "@utils/htpasswd";
import settings from "@utils/settings";

import { Auth } from "@models/config";

/**
 * Creates an htpasswd file in `settings.authPath`
 * The name of the file is a hash of the contents
 * @param users an array of {@link Auth} objects
 * @returns {object} An object containing the filepath and the hash
 */

export const createAuthFile = async (
	users: Auth[],
	defaultUsername: string
): Promise<{ filepath: string; hash: string }> => {
	const authUsers = users.map((user) =>
		"password" in user
			? {
					...user,
					username: user.username || defaultUsername
			  }
			: user.raw
	);

	const hash = createHash(JSON.stringify(authUsers));
	const filepath = join(settings.authPath, hash);

	if (!(await pathExists(filepath))) {
		const content = authUsers
			.map((user) => (typeof user == "string" ? user : htpasswd(user)))
			.join("\n");

		await outputFile(filepath, content);
	}

	return { filepath, hash };
};
