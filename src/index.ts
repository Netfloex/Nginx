import fs from "fs-extra";
import { join } from "path";
import createConfig from "./utils/createConfig";
import createHash from "./utils/createHash";
import downloadCSS from "./utils/downloadCss";
import env from "./utils/env";
import fileExist from "./utils/fileExist";
import parseConfig from "./utils/parseConfig";

const main = async () => {
	if (await fileExist(env.nginxConfigPath)) {
		console.log("Removing old configurations");

		await fs.emptyDir(env.nginxConfigPath);
	} else {
		console.log("No configurations found");
	}
	const config = await parseConfig();

	await Promise.all(
		config.map(async (server, i) => {
			const fileName =
				join(env.nginxConfigPath, `${i}-${server.filename}`) + ".conf";
			await fs.outputFile(fileName, await createConfig(server));

			console.log(new Date(), server.filename, "done");
		})
	);
};

console.log(new Date(), "Started");
main()
	.then(() => {
		console.log(new Date(), "Done");
	})
	.catch((error) => {
		console.error(error);
		console.log("This error was catched in index.ts");
	});
