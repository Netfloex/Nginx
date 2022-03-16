import { join } from "path";

import settings from "@utils/settings";

import { SimpleServer } from "@models/ParsedConfig";

type ServerWithNecessaryProperties = Pick<
	SimpleServer,
	"certbot_name" | "server_name"
>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const sslFilesFor = (server: ServerWithNecessaryProperties) => {
	const sslFile = (filename: string): string => sslFileFor(server, filename);
	return {
		ssl_certificate: sslFile("fullchain.pem"),
		ssl_certificate_key: sslFile("privkey.pem"),
		ssl_trusted_certificate: sslFile("chain.pem"),
		ssl_dhparam: settings.dhParamPath
	};
};

export const sslFileFor = (
	server: ServerWithNecessaryProperties,
	filename: string
): string =>
	join(
		settings.letsencryptPath, //						/etc/letsencrypt
		"live", //											/etc/letsencrypt/live
		server.certbot_name ?? server.server_name, //		/etc/letsencrypt/live/server
		filename //											/etc/letsencrypt/live/server/filename
	);
