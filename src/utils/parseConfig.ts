import { join } from "path";
import Config from "../models/config";
import SimpleServer from "../models/SimpleServer";
import fileExist from "./fileExist";

const configPath = join(__dirname, "../../config/config.js");

const parseConfig = async (): Promise<SimpleServer[]> => {
	if (!(await fileExist(configPath))) {
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
					websocket: false,
					custom_css: []
				});
			} else {
				if (options.proxy_pass) {
					servers.push({
						server_name: domain,
						proxy_pass: options.proxy_pass,
						filename: domain,
						websocket: options.websocket ?? false,
						custom_css: [options.custom_css ?? []].flat()
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
									websocket: false,
									custom_css: []
								});
							} else if (options.proxy_pass) {
								servers.push({
									server_name: subdomain + "." + domain,
									proxy_pass: options.proxy_pass,
									filename: subdomain,
									websocket: options.websocket ?? false,
									custom_css: [
										options.custom_css ?? []
									].flat()
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
