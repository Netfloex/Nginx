import { returnKeysFromOption } from "./validateConfig";

import ParsedConfig, {
	SimpleServer,
	ValidatedConfig,
	ValidatedServer
} from "@models/ParsedConfig";
import { Server } from "@models/config";

const parseOptions = (options: Server | ValidatedServer): ValidatedServer => ({
	proxy_pass: options.proxy_pass,
	websocket: options.websocket ?? false,
	custom_css: options.custom_css ?? [],
	custom_js: options.custom_js ?? [],
	return: options.return?.toString(),
	certbot_name: options.certbot_name,
	headers: {
		...options.headers,
		...("cors" in options && options.cors
			? {
					"Access-Control-Allow-Origin": options.cors
			  }
			: null)
	},
	redirect: options.redirect,
	rewrite: options.rewrite,
	auth: options.auth ?? false,
	html: options.html,

	locations: Object.entries(options.locations ?? {}).map(
		([path, options]) => ({
			location: path,
			...parseOptions(options)
		})
	)
});

const parseConfig = async (config: ValidatedConfig): Promise<ParsedConfig> => {
	const servers: SimpleServer[] = [];

	Object.entries(config.servers ?? {}).forEach(([domain, options]) => {
		if (returnKeysFromOption(options).length) {
			servers.push({
				server_name: domain,
				filename: domain,

				...parseOptions(options)
			});
		}
		Object.entries(options.subdomains ?? {}).forEach(
			([subdomain, options]) => {
				servers.push({
					server_name: subdomain + "." + domain,
					filename: subdomain,
					...parseOptions(options)
				});
			}
		);
	});
	return { ...config, servers };
};

export default parseConfig;
