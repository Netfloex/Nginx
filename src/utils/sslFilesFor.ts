import { join } from "path";

import { SimpleServer } from "@models/ParsedConfig";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const sslFilesFor = (server: Omit<SimpleServer, "filename">) => {
	const sslKeysPath = join(
		"/etc/letsencrypt/live",
		server.certbot_name ?? server.server_name
	);

	return {
		ssl_certificate: join(sslKeysPath, "fullchain.pem"),
		ssl_certificate_key: join(sslKeysPath, "privkey.pem"),
		ssl_trusted_certificate: join(sslKeysPath, "chain.pem"),
		ssl_dhparam: "/etc/letsencrypt/dhparams/dhparam.pem"
	};
};
