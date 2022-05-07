import { pathExists } from "fs-extra";
import { join } from "path";

import { logger } from "@lib/logger";
import createHash from "@utils/createHash";
import { downloadFile } from "@utils/downloadFile";
import settings from "@utils/settings";

const downloadJSToFile = async (custom_js: string[]): Promise<void> => {
	await Promise.all(
		custom_js.map(async (jsUrl): Promise<void> => {
			const urlHash = createHash(jsUrl);
			const fileName = join(
				settings.customFilesPath,
				"js",
				urlHash + ".js"
			);

			if (await pathExists(fileName)) {
				logger.cachedJS({ url: jsUrl });
				return;
			}

			logger.downloadJS({ url: jsUrl });
			await downloadFile(fileName, jsUrl).catch((err) =>
				logger.jsError({ error: err })
			);
		})
	);
};

export default downloadJSToFile;
