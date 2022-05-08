import Parser from "@webantic/nginx-config-parser";
import { outputFile, pathExists, readFile } from "fs-extra";
import { join } from "path";

import { logger } from "@lib/logger";
import settings from "@utils/settings";

import { NginxConf } from "@models/nginx.conf";

type EditConfigFunction = (nginxConfig: NginxConf) => NginxConf;

/**
 * Parses an existing `nginx.conf` and runs a callback to edit the configuration
 * What the callback returns will be outputted to the `nginx.conf`
 * @param editConfig A function that receives an object with the existing config or {} if it does not exist
 */

export const editNginxConfig = async (
	editConfig: EditConfigFunction
): Promise<void> => {
	const nginxPath = join(settings.nginxPath, "nginx.conf");

	let oldConfig: NginxConf;
	const parser = new Parser();

	if (await pathExists(nginxPath)) {
		const nginxConfig = await readFile(nginxPath, "utf-8");

		const concatSplitStrings = nginxConfig.replace(/" '\n\s+'/g, " ");

		oldConfig = parser.toJSON<NginxConf>(concatSplitStrings);
	} else {
		oldConfig = {};
		logger.nginxConfNotFound({ nginxPath });
	}

	const edited = editConfig(oldConfig);

	const config = parser.toConf<NginxConf>(edited);

	await outputFile(nginxPath, config);
};
