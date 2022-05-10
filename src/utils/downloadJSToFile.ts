import { logger } from "@lib/logger";
import { customFilesHelper } from "@utils/customFilesHelper";
import { downloadFile } from "@utils/downloadFile";

/**
 * Downloads files and places them in `settings.customFilesPath/js`
 * @param custom_js An array of urls
 */

export const downloadJSToFile = async (custom_js: string[]): Promise<void> => {
	await Promise.all(
		custom_js.map(async (url): Promise<void> => {
			const { exists, filepath } = await customFilesHelper(url, "js");

			if (exists) {
				logger.cachedJS({ url });
				return;
			}

			logger.downloadJS({ url });
			await downloadFile(filepath, url).catch((error) =>
				logger.jsError({ error })
			);
		})
	);
};
