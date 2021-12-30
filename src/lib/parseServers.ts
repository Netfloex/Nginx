import { returnKeysFromOption } from "./validateConfig";

import { SimpleServer } from "@models/ParsedConfig";
import { Server } from "@models/config";

const parseServers = async (
	servers: Record<string, Server> = {}
): Promise<SimpleServer[]> => {
	const simpleServers: SimpleServer[] = [];

	Object.entries(servers).forEach(([domain, options]) => {
		if (returnKeysFromOption(options).length) {
			simpleServers.push({
				server_name: domain,
				filename: domain,

				...options
			});
		}

		if ("subdomains" in options)
			Object.entries(options.subdomains ?? {}).forEach(
				([subdomain, options]) => {
					simpleServers.push({
						server_name: `${subdomain}.${domain}`,
						filename: subdomain,
						...options
					});
				}
			);
	});

	return simpleServers;
};

export default parseServers;
