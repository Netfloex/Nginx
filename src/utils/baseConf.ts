import ConfigParser, { NginxConfig } from "@webantic/nginx-config-parser";
import { readFile } from "fs-extra";
import { join } from "path";

import { nginxPath } from "@utils/env";

const baseConf = async (): Promise<NginxConfig> => {
	const parser = new ConfigParser();

	const NginxConfig = (
		await readFile(join(nginxPath, "baseConfig.conf"))
	).toString();

	return parser.toJSON(NginxConfig);
};

export default baseConf;
