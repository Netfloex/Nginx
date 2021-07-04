import ConfigParser from "@webantic/nginx-config-parser";
import { join } from "path";
import { Server } from "../models/config";
import baseConfig from "./baseConf";

const parser = new ConfigParser();

const createConfig = (server: Server) => {
	const JsonConf = { ...baseConfig };

	// Server Name
	JsonConf.server.server_name = server.server;

	// SSL Certificate files
	const sslKeysPath = join("/etc/letsencrypt/live", server.server, "/");
	JsonConf.server.ssl_certificate = sslKeysPath + "fullchain.pem";
	JsonConf.server.ssl_certificate_key = sslKeysPath + "privkey.pem";
	JsonConf.server.ssl_trusted_certificate = sslKeysPath + "chain.pem";

	// Proxy Pass
	JsonConf.server["location /"].proxy_pass = server.to;

	const config = parser.toConf(JsonConf);
	console.log(JsonConf);

	return config;
};

export default createConfig;
