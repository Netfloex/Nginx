import ConfigParser, { NginxConfig } from "@webantic/nginx-config-parser";
import { join } from "path";
import SimpleServer from "../models/SimpleServer";
import baseConf from "./baseConf";
import createHash from "./createHash";
import downloadCSSToFile from "./downloadCSSToFile";
import env from "./env";

const parser = new ConfigParser();

const createConfig = async (server: SimpleServer): Promise<string> => {
	const JsonConf: NginxConfig = await baseConf();

	// Server Name
	JsonConf.server.server_name = server.server_name;

	// SSL Certificate files
	const sslKeysPath = join("/etc/letsencrypt/live", server.server_name, "/");
	JsonConf.server.ssl_certificate = sslKeysPath + "fullchain.pem";
	JsonConf.server.ssl_certificate_key = sslKeysPath + "privkey.pem";
	JsonConf.server.ssl_trusted_certificate = sslKeysPath + "chain.pem";

	// Proxy Pass
	JsonConf.server["location /"].proxy_pass = server.proxy_pass;

	// Websockets
	if (server.websocket) {
		JsonConf.server.proxy_set_header = [
			"Upgrade $http_upgrade",
			"Connection $http_connection"
		];
		JsonConf.server.proxy_http_version = 1.1;
	}

	// Custom CSS
	if (server.custom_css.length) {
		const fileNames = server.custom_css.map((g) => createHash(g));
		JsonConf.server["location /"].sub_filter = `'</head>' '${fileNames
			.map(
				(hash) =>
					`<link rel="stylesheet" type="text/css" href="/custom_assets/css/${hash}.css">`
			)
			.join("")}</head>'`;

		JsonConf.server["location /custom_assets"] = {
			alias: env.customFilesPath
		};

		await downloadCSSToFile(server);
	}

	const config = parser.toConf(JsonConf);

	return config;
};

export default createConfig;
