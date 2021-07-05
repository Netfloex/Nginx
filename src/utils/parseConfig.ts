import { access, constants } from "fs-extra";
import { join } from "path";
import Config from "../models/config";
import SimpleServer from "../models/SimpleServer";

const configPath = join(__dirname, "../../config/config.js");

const checkFileExists = (file: string) =>
	access(file, constants.F_OK)
		.then(() => true)
		.catch(() => false);

const parseConfig = async (): Promise<SimpleServer[]> => {
	if (!(await checkFileExists(configPath))) {
		console.error("No config files found!");
		console.log("Please create one in: " + configPath);

		return [];
	} else {
		const config: Config = require(configPath);
		const servers: SimpleServer[] = [];

		Object.entries(config.servers ?? {}).forEach(([domain, options]) => {
			if (typeof options == "string") {
				servers.push({
					server_name: domain,
					proxy_pass: options,
					filename: domain,
					websocket: false
				});
			} else {
				if (options.proxy_pass) {
					servers.push({
						server_name: domain,
						proxy_pass: options.proxy_pass,
						filename: domain,
						websocket: options.websocket ?? false
					});
				}
				if (options.subdomains) {
					Object.entries(options.subdomains).forEach(
						([subdomain, options]) => {
							if (typeof options == "string") {
								servers.push({
									server_name: subdomain + "." + domain,
									proxy_pass: options,
									filename: subdomain,
									websocket: false
								});
							} else if (options.proxy_pass) {
								servers.push({
									server_name: subdomain + "." + domain,
									proxy_pass: options.proxy_pass,
									filename: subdomain,
									websocket: options.websocket ?? false
								});
							}
						}
					);
				}
			}
		});
		return servers;
	}
};

export default parseConfig;
