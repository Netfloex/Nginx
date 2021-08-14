import fs, { pathExists } from "fs-extra";
import { join } from "path";

import createConfig from "@utils/createConfig";
import env from "@utils/env";
import log from "@utils/log";
import parseConfig from "@utils/parseConfig";
import validateConfig from "@utils/validateConfig";

const configPath = join(process.cwd(), "config", "config.js");

const main = async (): Promise<void> => {
	if (!(await pathExists(configPath))) {
		return log.configNotFound(configPath);
	}

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const rawConfig = require(configPath);
	const validatedConfig = validateConfig(rawConfig);

	if (validatedConfig == null) {
		return log.exited();
	}

	const config = await parseConfig(validatedConfig);

	if (await pathExists(env.nginxConfigPath)) {
		log.rmOld(env.nginxConfigPath);
		await fs.emptyDir(env.nginxConfigPath);
	} else {
		log.noOld(env.nginxConfigPath);
	}

	await Promise.all(
		config.map(async (server, i) => {
			const fileName =
				join(env.nginxConfigPath, `${i}-${server.filename}`) + ".conf";
			await fs.outputFile(fileName, await createConfig(server));

			log.configDone(server.server_name);
		})
	);

	log.finished();
};

log.started();
main().catch((error) => {
	console.error(error);
});
