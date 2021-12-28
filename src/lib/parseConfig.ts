import { returnKeysFromOption } from "./validateConfig";

import ParsedConfig, {
	SimpleServer,
	ValidatedServer
} from "@models/ParsedConfig";
import { OutputConfig, Server } from "@models/config";

const parseOptions = (options: Server): ValidatedServer => ({
	...options,
	return: options.return?.toString(),
	headers: {
		...options.headers,
		...("cors" in options && options.cors
			? {
					"Access-Control-Allow-Origin": options.cors
			  }
			: null)
	},

	locations: Object.entries(options.locations ?? {}).map(
		([path, location]) => ({
			...parseOptions(location),
			location: path
		})
	)
});

const parseConfig = async (config: OutputConfig): Promise<ParsedConfig> => {
	const servers: SimpleServer[] = [];

	Object.entries(config.servers ?? {}).forEach(([domain, options]) => {
		if (returnKeysFromOption(options).length) {
			servers.push({
				server_name: domain,
				filename: domain,

				...parseOptions(options)
			});
		}
		if ("subdomains" in options)
			Object.entries(options.subdomains ?? {}).forEach(
				([subdomain, options]) => {
					servers.push({
						server_name: `${subdomain}.${domain}`,
						filename: subdomain,
						...parseOptions(options)
					});
				}
			);
	});

	return { ...config, servers };
};

export default parseConfig;
