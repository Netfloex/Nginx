import { pathExists } from "fs-extra";

import { logger } from "@lib/logger";
import { parseCertificateExpiry } from "@utils/parseCertificateExpiry";
import settings from "@utils/settings";
import { sslFileFor, sslFilesFor } from "@utils/sslFilesFor";

import { SimpleServer } from "@models/ParsedConfig";

/**
 * Returns a list of servers which has valid certificates
 *
 * If `settings.enableConfigMissingCerts` is true and `last` is true
 * it will always return all servers
 * @param servers An array of {@link SimpleServer}s
 * @param last If this is the last try
 * @returns An array of servers with valid certificates
 */

export const filterServersWithValidSslFiles = async (
	servers: SimpleServer[],
	last = false
): Promise<SimpleServer[]> => {
	const out: SimpleServer[] = [];

	server: for (const server of servers) {
		const sslFiles = sslFilesFor(server);
		const sslFilePaths = Object.values(sslFiles);

		for (const file of sslFilePaths) {
			if (!(await pathExists(file))) {
				// File does not exists

				if (!last)
					logger.missingSSLFiles({ serverName: server.server_name });
				else {
					logger.missingSSLFilesFinal({
						serverName: server.server_name
					});

					/* 
						This setting allows for a config without certificate files
						If it is the second try, return all configs
					*/
					if (settings.enableConfigMissingCerts) {
						out.push(server);
					}
				}

				continue server;
			}
		}

		const expiry = await parseCertificateExpiry(
			sslFileFor(server, "cert.pem")
		);

		if (!expiry) continue server;
		const days = expiry.diffNow().as("days");

		if (days < 30) {
			// Certificate expires in less than 30 days
			logger.certificateExpiry({
				serverName: server.server_name,
				days: days
			});
			continue server;
		}

		logger.certificateValid({ serverName: server.server_name, days: days });

		out.push(server);
	}

	return out;
};
