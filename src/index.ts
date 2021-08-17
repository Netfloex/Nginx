import { pathExists, outputFile, readdir, remove } from "fs-extra";
import { join } from "path";

import createConfig from "@lib/createConfig";
import parseConfig from "@lib/parseConfig";
import validateConfig from "@lib/validateConfig";
import updateCloudflareConfig from "@utils/enableCloudflare";
import { configPath, nginxConfigPath } from "@utils/env";
import log from "@utils/log";
import store from "@utils/useStore";

const main = async (): Promise<void> => {
	const started = Date.now();
	log.started();

	if (!(await pathExists(configPath))) {
		return log.configNotFound(configPath);
	}

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const rawConfig = require(configPath);
	const validatedConfig = await validateConfig(rawConfig);

	if (validatedConfig == null) {
		return log.exited();
	}

	const config = await parseConfig(validatedConfig);

	if (!(await pathExists(nginxConfigPath))) {
		log.noOld();
		return log.exited();
	}

	log.rmOld();

	// All Files starting with a digit
	const files = (await readdir(nginxConfigPath)).filter((g) =>
		g.match(/^\d/)
	);

	// Delete em
	await Promise.all(files.map((file) => remove(join(nginxConfigPath, file))));
	const promises = [];

	promises.push(
		...config.servers.map(async (server, i) => {
			const fileName =
				join(nginxConfigPath, `${i}-${server.filename}`) + ".conf";
			await outputFile(fileName, await createConfig(server));

			log.configDone(server.server_name);
		})
	);

	if (config.cloudflare) {
		await store.init();
		promises.push(updateCloudflareConfig());
	}

	await Promise.all(promises);

	log.finished(started);
};

main().catch((error) => {
	console.error(error);
});
