import { outputFile, pathExists, readdir, remove } from "fs-extra";
import { join } from "path";
import { rcFile } from "rc-config-loader";

import createConfig from "@lib/createConfig";
import parseConfig from "@lib/parseConfig";
import validateConfig from "@lib/validateConfig";
import {
	requestCloudflareIps,
	updateCloudflareRealIp
} from "@utils/cloudflare";
import { editNginxConfig } from "@utils/editNginxConfig";
import log from "@utils/log";
import settings from "@utils/settings";
import store from "@utils/useStore";

const main = async (): Promise<number> => {
	const started = Date.now();
	log.started();

	let configFileName = settings.configFile;

	if (!settings.configFile) {
		if (!(await pathExists(settings.configPath))) {
			log.configFolderNotFound(settings.configPath);
			return -1;
		}

		const configs = await readdir(settings.configPath);

		const configPaths = configs.filter((config) =>
			config.match(/^config\.(yml|yaml|jsonc?|js)$/)
		);

		if (!configPaths.length) {
			log.configNotFound(settings.configPath);
			return -1;
		} else if (configPaths.length > 1) {
			log.multipleConfigs(configPaths);
		}

		configFileName = join(settings.configPath, configPaths[0]);
	}

	const results = rcFile("config", {
		configFileName
	});

	if (!results) {
		log.configError(configFileName!);
		return -1;
	}

	const validatedConfig = await validateConfig(results.config);

	if (validatedConfig == null) {
		return -1;
	}
	log.configValid(configFileName!);

	const config = await parseConfig(validatedConfig);

	if (!(await pathExists(settings.nginxConfigPath))) {
		log.noOld();
		return -1;
	}

	log.rmOld();
	await readdir(settings.nginxConfigPath).then(async (files) => {
		const oldConfigFiles = files.filter((g) => g.match(/^\d/));
		// Delete em
		await Promise.all(
			oldConfigFiles.map((file) =>
				remove(join(settings.nginxConfigPath, file))
			)
		);
	});

	const promises: Promise<void>[] = [];

	if (config.cloudflare) {
		await store.init();
		if (config.cloudflare) {
			promises.push(requestCloudflareIps().then(updateCloudflareRealIp));
		}
	}

	if (config.nginx.log) {
		promises.push(
			(async (): Promise<void> => {
				await editNginxConfig((nginxConf) => {
					nginxConf.http ??= {};
					nginxConf.http.log_format = `main ${config.nginx.log}`;
					return nginxConf;
				});
			})()
		);
	}

	promises.push(
		...config.servers.map(async (server, i) => {
			const fileName =
				join(settings.nginxConfigPath, `${i}-${server.filename}`) +
				".conf";
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
