import { pathExists } from "fs-extra";
import { join } from "path";

import { createHash } from "@utils/createHash";
import settings from "@utils/settings";

interface CustomFilesPathObject {
	filepath: string;
	exists: boolean;
}

/**
 * Creates a path to store an url
 * Also says if the file already exists
 *
 * @param url The url to create a filepath for
 * @param type The extension and folder of the file
 * @returns An Promise<object> containing the filepath and if it the file already exists
 */

export const customFilesHelper = async (
	url: string,
	type: "css" | "js"
): Promise<CustomFilesPathObject> => {
	const urlHash = createHash(url);
	const filepath = join(settings.customFilesPath, type, `${urlHash}.${type}`);

	return {
		filepath,
		exists: await pathExists(filepath)
	};
};
