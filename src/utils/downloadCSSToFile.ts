import { outputFile } from "fs-extra";
import { inspect } from "util";

import { logger } from "@lib/logger";
import { customFilesHelper } from "@utils/customFilesHelper";
import { downloadCSS } from "@utils/downloadCSS";

/**
 * Uses {@link downloadCSS} to download and minify the CSS
 *
 * Stores it in a file inside `settings.customFilesPath/css`
 * @param custom_css An array of urls
 */

export const downloadCSSToFile = async (
	custom_css: string[]
): Promise<void> => {
	await Promise.all(
		custom_css.map(async (url) => {
			const { exists, filepath } = await customFilesHelper(url, "css");

			if (exists) {
				logger.cachedCSS({ url });
				return;
			}

			logger.downloadCSS({ url });
			await downloadCSS(url).then(async (output) => {
				if ("errors" in output) {
					logger.CSSError({
						url: url,
						error: Array.isArray(output.errors)
							? output.errors.join("\n")
							: inspect(output.errors)
					});

					return;
				}

				logger.downloadedCSS({ url });

				await outputFile(filepath, output.styles).catch((error) => {
					logger.CSSWriteError({ filepath, error });
				});
			});
		})
	);
};
