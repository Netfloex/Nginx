import { outputFile } from "fs-extra";
import { join } from "path";
import createHash from "./createHash";
import downloadCSS from "./downloadCss";
import env from "./env";
import fileExist from "./fileExist";
import log from "./log";

const downloadCSSToFile = async (custom_css: string[]): Promise<void> => {
	await Promise.all(
		custom_css.map(async (cssUrl) => {
			const urlHash = createHash(cssUrl);
			const fileName = join(env.customFilesPath, "css", urlHash + ".css");

			if (await fileExist(fileName)) {
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
