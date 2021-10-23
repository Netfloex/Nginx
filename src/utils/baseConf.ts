import ConfigParser, { NginxConfig } from "@webantic/nginx-config-parser";
import { readFile } from "fs-extra";
import { join } from "path";

import settings from "@utils/settings";

const baseConf = async (): Promise<NginxConfig> => {
	const parser = new ConfigParser();

	const NginxConfig = (
		await readFile(join(settings.nginxIncludePath, "baseConfig.conf"))
	).toString();

	return parser.toJSON<NginxConfig>(NginxConfig);
};

export default baseConf;
