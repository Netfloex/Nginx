import ConfigParser, { NginxConfig } from "@webantic/nginx-config-parser";
import fs from "fs-extra";
import { join } from "path";

const parser = new ConfigParser();

const NginxConfig = fs
	.readFileSync(join(process.cwd(), "src", "nginx", "baseConfig.conf"))
	.toString();
const JsonConfig = parser.toJSON(NginxConfig);

export default JsonConfig;
