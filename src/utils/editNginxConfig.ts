import Parser from "@webantic/nginx-config-parser";
import { pathExists, readFile, writeFile } from "fs-extra";
import { join } from "path";

import { logger } from "@lib/logger";
import settings from "@utils/settings";

import { NginxConf } from "@models/nginx.conf";

type EditConfigFunction = (nginxConfig: NginxConf) => NginxConf;

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

	await writeFile(nginxPath, config);
};
