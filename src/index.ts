import fs from "fs-extra";
import { join } from "path";
import createConfig from "./utils/createConfig";
import createHash from "./utils/createHash";
import downloadCSS from "./utils/downloadCss";
import fileExist from "./utils/fileExist";
import parseConfig from "./utils/parseConfig";

const nginxConfPath = process.env.NGINX_CONFIG_PATH ?? "/etc/nginx/user_conf.d";
const cssFilesPath = process.env.CUSTOM_FILES_PATH ?? "/app/custom";

const main = async () => {
	await fs.emptyDir(nginxConfPath);
	const config = await parseConfig();

	await Promise.all(
		config.map(async (server, i) => {
			const fileName =
				join(nginxConfPath, `${i}-${server.filename}`) + ".conf";
			await fs.writeFile(fileName, createConfig(server));

			await Promise.all(
				server.custom_css.map(async (cssUrl) => {
					const urlHash = createHash(cssUrl);
					const fileName = join(cssFilesPath, urlHash + ".css");
					if (await fileExist(fileName)) {
						console.log(
							`${cssUrl} is already downloaded, skipping`
						);

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
						await fs
							.outputFile(fileName, output.styles)
							.then(() => {
								console.log(
									`${cssUrl} ${output.hash} downloaded and compressed.`
								);
							});
					});
				})
			);
			console.log(new Date(), server.filename, "done");
		})
	);
};

console.log(new Date(), "Started");
main().then(() => {
	console.log(new Date(), "Done");
});
