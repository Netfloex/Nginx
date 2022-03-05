import { readFile } from "fs-extra";
import { load, YAMLException } from "js-yaml";
import JSON5 from "json5";
import { extname } from "path";

import log from "@utils/log";

const parseUserConfig = async (
	configFilePath: string
): Promise<Record<string, unknown> | false> => {
	const ext = extname(configFilePath);

	if (ext.match(/^\.js$/)) {
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const data: unknown = require(configFilePath);
			if (typeof data == "object" && data) {
				return data as Record<string, unknown>;
			} else if (typeof data == "function") {
				return await data();
			} else {
				log.configJSInvalidType(typeof data, ["object", "function"]);
				return false;
			}
		} catch (error) {
			log.configJSError(error as Error);
			return false;
		}
	}

	const content = await readFile(configFilePath, "utf-8");

	if (ext.match(/^\.ya?ml$/)) {
		try {
			return load(content) as Record<string, unknown>;
		} catch (error) {
			log.configYamlError(error as YAMLException);
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
								log.configENVNotFound(match, env);
							}
						});
					}
				}
				return value;
			});
		} catch (error) {
			log.configJSONError(error as Error);
			return false;
		}
	}

	throw new Error(`Unsupported Extension: ${ext}`);
};

export default parseUserConfig;
