import { outputFile, pathExists, readdir, remove } from "fs-extra";
import { join } from "path";

import createConfig from "@lib/createConfig";
import parseServers from "@lib/parseServers";
import validateConfig from "@lib/validateConfig";
import {
	requestCloudflareIps,
	updateCloudflareRealIp
} from "@utils/cloudflare";
import { editNginxConfig } from "@utils/editNginxConfig";
import log from "@utils/log";
import parseUserConfig from "@utils/parseUserConfig";
import settings from "@utils/settings";
import store from "@utils/useStore";

enum ExitCode {
	success = 0,
	failure = -1
}

const main = async (): Promise<ExitCode> => {
	let stopping = false;

	let configFilePath = settings.configFile;

	if (configFilePath) {
		if (!(await pathExists(configFilePath))) {
			log.configNotFound(configFilePath);
			stopping = true;
		}
	} else {
		if (!(await pathExists(settings.configPath))) {
			log.configFolderNotFound(settings.configPath);
			stopping = true;
		} else {
			const configs = await readdir(settings.configPath);

			const configPaths = configs.filter((config) =>
				config.match(/^config\.(ya?ml|json[c5]?|js)$/)
			);

			if (!configPaths.length) {
				log.configNotFound(settings.configPath);
				stopping = true;
			} else {
				if (configPaths.length > 1) {
					log.multipleConfigs(configPaths);
				}

				configFilePath = join(settings.configPath, configPaths[0]);
			}
		}
	}

	let results;
	if (!stopping) {
		results = await parseUserConfig(configFilePath!);

		if (!results) {
			log.configError(configFilePath!);
			stopping = true;
		}

		if (Object.keys(results).length == 0) {
			log.configEmpty();
			stopping = true;
		}
	}

	if (stopping) {
		return ExitCode.failure;
	}

	const validatedConfig = await validateConfig(results);

	if (!settings.certbotMail) {
		log.noCertbotEmail();
		stopping = false;
	}

	if (validatedConfig == null || stopping) {
		return ExitCode.failure;
	}

	log.configValid(configFilePath!);

	const config = {
		...validatedConfig,
		servers: await parseServers(validatedConfig.servers)
	};

	if (!(await pathExists(settings.nginxConfigPath))) {
		log.noOld();
		return ExitCode.failure;
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
	} else {
		remove(settings.cloudflareConfPath);
	}

	if (config?.nginx?.log) {
		promises.push(
			(async (): Promise<void> => {
				await editNginxConfig((nginxConf) => {
					nginxConf.http ??= {};
					nginxConf.http.log_format = `main ${config!.nginx!.log}`;
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

	return ExitCode.success;
};

const started = Date.now();
log.started();
main()
	.then((exitCode) => {
		if (exitCode == ExitCode.success) {
			log.finished(started);
		} else {
			log.exited();
			process.exitCode = ExitCode.failure;
		}
	})
	.catch((error) => {
		log.exception();
		console.error(error);
		log.exited();
		process.exitCode = ExitCode.failure;
	});
