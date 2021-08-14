import SimpleServer, { Location } from "@models/SimpleServer";
import Config, { Locations } from "@models/config";

const parseLocations = (unparsedLocation?: Locations): Location[] => {
	const locations: Location[] = [];
	if (!unparsedLocation) {
		return locations;
	}
	Object.entries(unparsedLocation).forEach(([path, options]) => {
		if (typeof options == "string") {
			locations.push({
				location: path,
				custom_css: [],
				custom_js: [],
				websocket: false,
				proxy_pass: options
			});
		} else {
			locations.push({
				location: path,
				custom_css: [options.custom_css ?? []].flat(),
				custom_js: [options.custom_js ?? []].flat(),
				websocket: options.websocket ?? false,
				proxy_pass: options.proxy_pass
			});
		}
	});
	return locations;
};

const parseConfig = async (config: Config): Promise<SimpleServer[]> => {
	const servers: SimpleServer[] = [];

	Object.entries(config.servers ?? {}).forEach(([domain, options]) => {
		if (typeof options == "string") {
			servers.push({
				server_name: domain,
				proxy_pass: options,
				filename: domain,
				websocket: false,
				custom_css: [],
				custom_js: [],
				locations: []
			});
		} else {
			servers.push({
				server_name: domain,
				proxy_pass: options.proxy_pass,
				filename: domain,
				websocket: options.websocket ?? false,
				custom_css: [options.custom_css ?? []].flat(),
				custom_js: [options.custom_js ?? []].flat(),
				locations: parseLocations(options.locations)
			});
			if (options.subdomains) {
				Object.entries(options.subdomains).forEach(
					([subdomain, options]) => {
						if (typeof options == "string") {
							servers.push({
								server_name: subdomain + "." + domain,
								proxy_pass: options,
								filename: subdomain,
								websocket: false,
								custom_js: [],
								custom_css: [],
								locations: []
							});
						} else if (options.proxy_pass) {
							servers.push({
								server_name: subdomain + "." + domain,
								proxy_pass: options.proxy_pass,
								filename: subdomain,
								websocket: options.websocket ?? false,
								custom_css: [options.custom_css ?? []].flat(),
								custom_js: [options.custom_js ?? []].flat(),
								locations: parseLocations(options.locations)
							});
						}
					}
				);
			}
		}
	});
	return servers;
};

export default parseConfig;
