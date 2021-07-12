import { outputFile } from "fs-extra";
import { join } from "path";
import createHash from "./createHash";
import downloadCSS from "./downloadCss";
import env from "./env";
import fileExist from "./fileExist";

const downloadCSSToFile = async (custom_css: string[]): Promise<void> => {
	await Promise.all(
		custom_css.map(async (cssUrl) => {
			const urlHash = createHash(cssUrl);
			const fileName = join(env.customFilesPath, "css", urlHash + ".css");

			if (await fileExist(fileName)) {
				console.log(`${cssUrl} is already downloaded, skipping`);

				return;
			}
			console.log(`Downloading ${cssUrl}...`);
			await downloadCSS(cssUrl).then(async (output) => {
				if (output.errors) {
					console.error("CSS Parsing failed, error:");
					console.log(
						Array.isArray(output.errors)
							? output.errors.join("\n")
							: output.errors
					);

					return;
				}
				console.log(`${cssUrl} downloaded.`);

				await outputFile(fileName, output.styles)
					.then(() => {
						console.log(
							`${cssUrl} ${output.hash} downloaded and compressed.`
						);
					})
					.catch((e) => {
						console.error(
							`There was an error creating the file ${fileName}`
						);
						console.error("The error:");
						console.error(e);

						throw e;
					});
			});
		})
	);
};

export default downloadCSSToFile;
