import ConfigParser from "@webantic/nginx-config-parser";
import { join } from "path";
import SimpleServer from "../models/SimpleServer";
import baseConfig from "./baseConf";

const parser = new ConfigParser();

const createConfig = (server: SimpleServer): string => {
	const JsonConf = { ...baseConfig };

	// Server Name
	JsonConf.server.server_name = server.server_name;

	// SSL Certificate files
	const sslKeysPath = join("/etc/letsencrypt/live", server.server_name, "/");
	JsonConf.server.ssl_certificate = sslKeysPath + "fullchain.pem";
	JsonConf.server.ssl_certificate_key = sslKeysPath + "privkey.pem";
	JsonConf.server.ssl_trusted_certificate = sslKeysPath + "chain.pem";

	// Proxy Pass
	JsonConf.server["location /"].proxy_pass = server.proxy_pass;

	if (server.websocket) {
		JsonConf.server.proxy_set_header = [
			"Upgrade $http_upgrade",
			"Connection $http_connection"
		];
		JsonConf.server.proxy_http_version = 1.1;
	}

	const config = parser.toConf(JsonConf);

	return config;
};

export default createConfig;
