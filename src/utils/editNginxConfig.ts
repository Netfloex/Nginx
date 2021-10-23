import Parser from "@webantic/nginx-config-parser";
import { readFile, writeFile } from "fs-extra";
import { join } from "path";

import settings from "@utils/settings";

import { NginxConf } from "@models/nginx.conf";

type EditConfigFunction = (nginxConfig: NginxConf) => NginxConf;

export const editNginxConfig = async (
	editConfig: EditConfigFunction
): Promise<void> => {
	const nginxPath = join(settings.nginxPath, "nginx.conf");
	const nginxConfig = await readFile(nginxPath, "utf8");

	const concatSplitStrings = nginxConfig.replace(/" '\n\s+'/g, " ");

	const parser = new Parser();

	const parsed = parser.toJSON<NginxConf>(concatSplitStrings);

	const edited = editConfig(parsed);

	const config = parser.toConf<NginxConf>(edited);

	await writeFile(nginxPath, config);
};
