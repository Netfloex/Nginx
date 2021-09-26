import { pathExists, outputFile, readdir, remove } from "fs-extra";
import { join } from "path";

import createConfig from "@lib/createConfig";
import parseConfig from "@lib/parseConfig";
import validateConfig from "@lib/validateConfig";
import {
	requestCloudflareIps,
	updateCloudflareRealIp
} from "@utils/cloudflare";
import { configPath, nginxConfigPath } from "@utils/env";
import log from "@utils/log";
import store from "@utils/useStore";

const main = async (): Promise<number> => {
	const started = Date.now();
	log.started();

	if (!(await pathExists(configPath))) {
		log.configNotFound(configPath);
		return -1;
	}

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const rawConfig = require(configPath);
	const validatedConfig = await validateConfig(rawConfig);

	if (validatedConfig == null) {
		return -1;
	}

	const config = await parseConfig(validatedConfig);

	if (!(await pathExists(nginxConfigPath))) {
		log.noOld();
		return -1;
	}

	log.rmOld();

	// All Files starting with a digit
	const files = (await readdir(nginxConfigPath)).filter((g) =>
		g.match(/^\d/)
	);

	// Delete em
	await Promise.all(files.map((file) => remove(join(nginxConfigPath, file))));

	const promises: Promise<void>[] = [];

	if (config.cloudflare) {
		await store.init();
		if (config.cloudflare) {
			promises.push(requestCloudflareIps().then(updateCloudflareRealIp));
		}
	}

	promises.push(
		...config.servers.map(async (server, i) => {
			const fileName =
				join(nginxConfigPath, `${i}-${server.filename}`) + ".conf";
			await outputFile(fileName, await createConfig(server));

			log.configDone(server.server_name);
		})
	);

	await Promise.all(promises);

	log.finished(started);
	return 0;
};

main()
	.then((code) => {
		if (code == -1) {
			log.exited();
			process.exitCode = -1;
		}
	})
	.catch((error) => {
		console.error(error);
		process.exitCode = -1;
	});
