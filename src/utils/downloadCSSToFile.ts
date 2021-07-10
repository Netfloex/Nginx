import { outputFile } from "fs-extra";
import { join } from "path";
import SimpleServer from "../models/SimpleServer";
import createHash from "./createHash";
import downloadCSS from "./downloadCss";
import env from "./env";
import fileExist from "./fileExist";

const downloadCSSToFile = async (server: SimpleServer): Promise<void> => {
	await Promise.all(
		server.custom_css.map(async (cssUrl) => {
			const urlHash = createHash(cssUrl);
			const fileName = join(env.customFilesPath, "css", urlHash + ".css");
			if (await fileExist(fileName)) {
				console.log(`${cssUrl} is already downloaded, skipping`);

				return;
			}
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
				await outputFile(fileName, output.styles).then(() => {
					console.log(
						`${cssUrl} ${output.hash} downloaded and compressed.`
					);
				});
			});
		})
	);
};

export default downloadCSSToFile;
