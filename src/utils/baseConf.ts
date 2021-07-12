import ConfigParser, { NginxConfig } from "@webantic/nginx-config-parser";
import { readFile } from "fs-extra";
import { join } from "path";

const baseConf = async (): Promise<NginxConfig> => {
	const parser = new ConfigParser();

	const NginxConfig = (
		await readFile(join(process.cwd(), "src", "nginx", "baseConfig.conf"))
	).toString();

	return parser.toJSON(NginxConfig);
};
export default baseConf;
