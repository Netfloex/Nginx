import ParsedConfig, {
	SimpleServer,
	ValidatedServer
} from "@models/ParsedConfig";
import Config, { Server } from "@models/config";

const parseOptions = (options: Server | ValidatedServer): ValidatedServer => ({
	proxy_pass: options.proxy_pass,
	websocket: options.websocket ?? false,
	custom_css: options.custom_css ?? [],
	custom_js: options.custom_js ?? [],
	return: options.return?.toString(),
	nossl: options.nossl ?? false,

	locations: Object.entries(options.locations ?? {}).map(
		([path, options]) => ({
			location: path,
			...parseOptions(options)
		})
	)
});

const parseConfig = async (config: Config): Promise<ParsedConfig> => {
	const servers: SimpleServer[] = [];

	Object.entries(config.servers ?? {}).forEach(([domain, options]) => {
		servers.push({
			server_name: domain,
			filename: domain,

			...parseOptions(options)
		});
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
