import ConfigParser, { NginxConfig } from "@webantic/nginx-config-parser";
import { readFile } from "fs-extra";
import { join } from "path";

import settings from "@utils/settings";

/**
 * @returns a JavaScript object with the baseConfig specified in `settings.nginxIncludePath`
 */

export const baseConf = async (): Promise<NginxConfig> => {
	const parser = new ConfigParser();

	const NginxConfig = await readFile(
		join(settings.nginxIncludePath, "baseConfig.conf"),
		"utf-8"
	);

	return parser.toJSON<NginxConfig>(NginxConfig);
};
