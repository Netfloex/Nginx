import { pathExists } from "fs-extra";
import { join } from "path";

import { logger } from "@lib/logger";
import { createHash } from "@utils/createHash";
import { downloadFile } from "@utils/downloadFile";
import settings from "@utils/settings";

/**
 * Downloads files and places them in `settings.customFilesPath/js`
 * @param custom_js An array of urls
 */

export const downloadJSToFile = async (custom_js: string[]): Promise<void> => {
	await Promise.all(
		custom_js.map(async (jsUrl): Promise<void> => {
			const urlHash = createHash(jsUrl);
			const filepath = join(
				settings.customFilesPath,
				"js",
				urlHash + ".js"
			);

			if (await pathExists(filepath)) {
				logger.cachedJS({ url: jsUrl });
				return;
			}

			logger.downloadJS({ url: jsUrl });
			await downloadFile(filepath, jsUrl).catch((err) =>
				logger.jsError({ error: err })
			);
		})
	);
};
