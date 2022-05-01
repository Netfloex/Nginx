import { readFile } from "fs-extra";
import { load, YAMLException } from "js-yaml";
import JSON5 from "json5";
import { extname } from "path";

import { logger } from "@lib/logger";

const parseUserConfig = async (
	configFilePath: string
): Promise<Record<string, unknown> | false> => {
	const ext = extname(configFilePath);

	if (ext == ".js") {
		try {
			const imported = await import(configFilePath);
			const data = imported.default;
			if (typeof data == "object" && data) {
				return data as Record<string, unknown>;
			} else if (typeof data == "function") {
				const generatedData = data();

				if (generatedData instanceof Promise) {
					logger.configPromise();
				}

				return await generatedData;
			} else {
				logger.configJSInvalidType({
					type: typeof data,
					expected: ["object", "function"]
				});
				return false;
			}
		} catch (error) {
			logger.configJSError({ error });
			return false;
		}
	}

	const content = await readFile(configFilePath, "utf-8");

	if (ext.match(/^\.ya?ml$/)) {
		try {
			return load(content) as Record<string, unknown>;
		} catch (error) {
			logger.configYamlError({ error: error as YAMLException });
			return false;
		}
	}

	if (ext.match(/^\.json[c5]?$/)) {
		try {
			return JSON5.parse(content, (_, value) => {
				if (typeof value == "string") {
					const matches = value.match(/%env:([\w-]+)%/g);

					if (matches) {
						matches.forEach((match) => {
							const env = match.match(/%env:([\w-]+)%/)![1];

							if (process.env[env]) {
								value = value.replace(
									`%env:${env}%`,
									process.env[env]
								);
							} else {
								logger.configENVNotFound({
									env,
									envKey: match
								});
							}
						});
					}
				}
				return value;
			});
		} catch (error) {
			logger.configJSONError({ error });
			return false;
		}
	}

	throw new Error(`Unsupported Extension: ${ext}`);
};

export default parseUserConfig;
