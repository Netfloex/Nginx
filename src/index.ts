import { pathExists, outputFile, emptyDir, readdir, remove } from "fs-extra";
import { join } from "path";

import createConfig from "@utils/createConfig";
import updateCloudflareConfig from "@utils/enableCloudflare";
import env from "@utils/env";
import log from "@utils/log";
import parseConfig from "@utils/parseConfig";
import validateConfig from "@utils/validateConfig";

const configPath = join(process.cwd(), "config", "config.js");

const main = async (): Promise<void> => {
	const started = Date.now();
	log.started();

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

	if (!(await pathExists(env.nginxConfigPath))) {
		log.noOld(env.nginxConfigPath);
		return log.exited();
	}

	log.rmOld(env.nginxConfigPath);

	// All Files starting with a digit
	const files = (await readdir(env.nginxConfigPath)).filter((g) =>
		g.match(/^\d/)
	);

	// Delete em
	await Promise.all(
		files.map((file) => remove(join(env.nginxConfigPath, file)))
	);
	const promises = [];

	promises.push(
		...config.servers.map(async (server, i) => {
			const fileName =
				join(env.nginxConfigPath, `${i}-${server.filename}`) + ".conf";
			await outputFile(fileName, await createConfig(server));

			log.configDone(server.server_name);
		})
	);

	if (config.cloudflare) {
		promises.push(updateCloudflareConfig());
	}

	await Promise.all(promises);

	log.finished(started);
};

main().catch((error) => {
	console.error(error);
});
