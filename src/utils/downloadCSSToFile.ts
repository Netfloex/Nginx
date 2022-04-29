import { outputFile, pathExists } from "fs-extra";
import { join } from "path";

import { logger } from "@lib/logger";
import createHash from "@utils/createHash";
import downloadCSS from "@utils/downloadCSS";
import settings from "@utils/settings";

const downloadCSSToFile = async (custom_css: string[]): Promise<void> => {
	await Promise.all(
		custom_css.map(async (cssUrl) => {
			const urlHash = createHash(cssUrl);
			const fileName = join(
				settings.customFilesPath,
				"css",
				urlHash + ".css"
			);

			if (await pathExists(fileName)) {
				logger.cachedCSS({ url: cssUrl });
				return;
			}
			logger.downloadCSS({ url: cssUrl });
			await downloadCSS(cssUrl).then(async (output) => {
				if (output.errors) {
					logger.CSSError({
						url: cssUrl,
						error: Array.isArray(output.errors)
							? output.errors.join("\n")
							: output.errors
					});

					return;
				}

				logger.downloadedCSS({ url: cssUrl });

				await outputFile(fileName, output.styles).catch((e) => {
					logger.CSSWriteError({ fileName, error: e });

					throw e;
				});
			});
		})
	);
};

export default downloadCSSToFile;
