import fs, { pathExists } from "fs-extra";
import { join } from "path";

import createConfig from "@utils/createConfig";
import env from "@utils/env";
import log from "@utils/log";
import parseConfig from "@utils/parseConfig";

const main = async (): Promise<void> => {
	if (await pathExists(env.nginxConfigPath)) {
		log.rmOld(env.nginxConfigPath);
		await fs.emptyDir(env.nginxConfigPath);
	} else {
		log.noOld(env.nginxConfigPath);
	}

	const config = await parseConfig();

	await Promise.all(
		config.map(async (server, i) => {
			const fileName =
				join(env.nginxConfigPath, `${i}-${server.filename}`) + ".conf";
			await fs.outputFile(fileName, await createConfig(server));

			log.configDone(server.server_name);
		})
	);
};

log.started();
main()
	.then(() => {
		log.finished();
	})
	.catch((error) => {
		console.error(error);
	});
