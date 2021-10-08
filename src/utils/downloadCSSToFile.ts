import { outputFile, pathExists } from "fs-extra";
import { join } from "path";

import createHash from "@utils/createHash";
import downloadCSS from "@utils/downloadCSS";
import log from "@utils/log";
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
				log.cachedCSS(cssUrl);
				return;
			}
			log.downloadCSS(cssUrl);
			await downloadCSS(cssUrl).then(async (output) => {
				if (output.errors) {
					log.CSSError(
						cssUrl,
						Array.isArray(output.errors)
							? output.errors.join("\n")
							: output.errors
					);

					return;
				}

				log.CSSDownloaded(cssUrl);

				await outputFile(fileName, output.styles).catch((e) => {
					log.CSSWriteError(fileName, e);

					throw e;
				});
			});
		})
	);
};

export default downloadCSSToFile;
