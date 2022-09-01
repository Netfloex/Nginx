import chalk from "chalk";
import type { FSWatcher } from "chokidar";
import chokidar from "chokidar";
import { pathExists, readdir, remove } from "fs-extra";
import { version } from "package.json";
import { join } from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { certbot } from "@lib/certbot";
import { logger, resetStarted, started } from "@lib/logger";
import parseServers from "@lib/parseServers";
import validateConfig from "@lib/validateConfig";
import { cloudflare } from "@utils/cloudflare";
import { createConfigFiles } from "@utils/createConfigFiles";
import { createDHPemIfNotExists } from "@utils/createDHPemIfNotExists";
import { editNginxConfig } from "@utils/editNginxConfig";
import { filterServersWithValidSslFiles } from "@utils/filterServersWithValidSslFiles";
import { htpasswd } from "@utils/htpasswd";
import { parseUserConfig } from "@utils/parseUserConfig";
import settings from "@utils/settings";
import { store } from "@utils/store";

import { ParsedConfig } from "@models/ParsedConfig";

enum ExitCode {
	success = 0,
	failure = -1
}
let watcher: FSWatcher | undefined;

const createWatcherOnce = async (path: string): Promise<FSWatcher> => {
	await watcher?.close();
	watcher = chokidar.watch(path, {});
	return watcher;
};

const main = async ({
	justLogConfig,
	certificatesOnly
}: {
	justLogConfig?: boolean;
	certificatesOnly?: boolean;
} = {}): Promise<ExitCode | [exitCode: ExitCode, created: number]> => {
	let stopping = false;
	const promises: Promise<void>[] = [];

	let configFilePath = settings.configFile;

	if (configFilePath) {
		if (!(await pathExists(configFilePath))) {
			logger.configNotFound({ path: configFilePath });
			stopping = true;
		}
	} else {
		if (!(await pathExists(settings.configPath))) {
			logger.configFolderNotFound({ path: settings.configPath });
			stopping = true;
		} else {
			const configs = await readdir(settings.configPath);

			const configPaths = configs.filter((config) =>
				config.match(/^config\.(ya?ml|json[c5]?|js)$/)
			);

			if (!configPaths.length) {
				logger.configNotFound({ path: settings.configPath });
				stopping = true;
			} else {
				if (configPaths.length > 1) {
					logger.multipleConfigs({ configs: configPaths });
				}

				configFilePath = join(settings.configPath, configPaths[0]);
			}
		}
	}
	if (settings.watchConfigFile) {
		(await createWatcherOnce(configFilePath!)).on("change", () => {
			startMain();
		});
	}

	let results;
	if (!stopping) {
		results = await parseUserConfig(configFilePath!);

		if (results === false) {
			logger.configError({ config: configFilePath! });
			stopping = true;
		}

		if (!results || Object.keys(results).length == 0) {
			logger.configEmpty({ config: configFilePath! });
			stopping = true;
		}
	}

	if (stopping) {
		return ExitCode.failure;
	}

	const validatedConfig = await validateConfig(results);

	if (justLogConfig) {
		console.log(
			chalk.bold("\nParsed Config"),
			chalk.dim("\n" + JSON.stringify(results, null, "\t"))
		);
	}

	if (validatedConfig == null) {
		return ExitCode.failure;
	}

	logger.configValid({ file: configFilePath! });

	const config: ParsedConfig = {
		...validatedConfig,
		servers: await parseServers(validatedConfig.servers)
	};

	if (justLogConfig) {
		console.log(
			chalk.bold("\nValidated Config"),
			chalk.dim("\n" + JSON.stringify(validatedConfig, null, "\t"))
		);
		return ExitCode.success;
	}

	if (!certificatesOnly) {
		if (!(await pathExists(settings.nginxConfigPath))) {
			logger.noOldConfigs();
			logger.configsLocationHint();
			return ExitCode.failure;
		}

		logger.removeOldConfigs();
		await readdir(settings.nginxConfigPath).then(async (files) => {
			const oldConfigFiles = files.filter((g) => g.match(/^\d/));
			// Delete em
			await Promise.all(
				oldConfigFiles.map((file) =>
					remove(join(settings.nginxConfigPath, file))
				)
			);
		});

		if (config.cloudflare) {
			await store.init();
			promises.push(cloudflare());
		} else {
			promises.push(remove(settings.cloudflareConfPath));
		}

		promises.push(
			editNginxConfig((nginxConf) => {
				nginxConf.http ??= {};

				if (config.nginx?.log)
					nginxConf.http.log_format = `main ${config.nginx.log}`;

				nginxConf.http.server_tokens = config.nginx?.server_tokens
					? "on"
					: "off";

				return nginxConf;
			})
		);
	}

	const sslServers = config.servers.filter((server) => !server.disable_cert);
	const { validServers, invalidSslServers } =
		await filterServersWithValidSslFiles(sslServers);

	const configsCreatedFirst = [
		...validServers, // SSL enabled servers, with all files for it
		...config.servers.filter((server) => server.disable_cert) // SSL Disabled Servers
	];

	if (!certificatesOnly) {
		promises.push(
			...createConfigFiles(configsCreatedFirst, config.username)
		);
	}

	promises.push(certbot(invalidSslServers));

	if (invalidSslServers.length) promises.push(createDHPemIfNotExists());

	//  Make sure all certificate files are created
	await Promise.all(promises);

	// If there still are missing certificate files
	// Try again
	const configsCreatedSecond = (
		await filterServersWithValidSslFiles(
			invalidSslServers.map(({ server }) => server),
			true
		)
	).validServers;

	if (!certificatesOnly) {
		await Promise.all(
			createConfigFiles(configsCreatedSecond, config.username)
		);
	}

	return [
		ExitCode.success,
		configsCreatedFirst.length + configsCreatedSecond.length
	];
};

export const startMain = (...params: Parameters<typeof main>): void => {
	resetStarted();
	logger.start();
	main(...params)
		.then((data) => {
			const exitCode = Array.isArray(data) ? data[0] : data;
			if (exitCode == ExitCode.success) {
				logger.done({
					started,
					configsCreated: Array.isArray(data) ? data[1] : undefined
				});
			} else {
				logger.exited({ started });
				process.exitCode = ExitCode.failure;
			}
		})
		.catch((error) => {
			logger.exception();
			console.error(error);
			logger.exited({ started });
			process.exitCode = ExitCode.failure;
		});
};

yargs(hideBin(process.argv))
	.scriptName("ncm")
	.version(version)
	// .help()
	.alias("h", "help")
	.alias("v", "version")
	.command("run", "Runs ncm", {}, () => startMain())
	.command(
		"htpasswd",
		"Creates an apache md5 hashed password",
		(yargs) =>
			yargs.options({
				username: {
					type: "string",
					alias: "u",
					default: "username"
				},
				password: {
					type: "string",
					alias: "p",
					requiresArg: true,
					required: true
				}
			}),
		({ username, password }) => {
			console.log("Created a htpasswd string");
			console.log(chalk.dim(htpasswd({ username, password })));
		}
	)
	.command("debug-config", "Outputs the parsed config", {}, () => {
		startMain({ justLogConfig: true });
	})
	.command("settings", "Shows a list of the current settings", {}, () => {
		console.log(settings);
	})
	.command("certificates", "only renews/creates certificates", {}, () => {
		startMain({ certificatesOnly: true });
	})
	.strict()
	.demandCommand()
	.parse();
