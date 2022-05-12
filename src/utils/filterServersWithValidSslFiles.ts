import { pathExists } from "fs-extra";

import { logger } from "@lib/logger";
import { msToDays } from "@utils/msToDays";
import { parseCertificateFile } from "@utils/parseCertificateFile";
import settings from "@utils/settings";
import { sslFileFor, sslFilesFor } from "@utils/sslFilesFor";

import { SimpleServer } from "@models/ParsedConfig";

export interface InvalidSslServer {
	server: SimpleServer;
	reason: "expired" | "staging" | "missing";
}

export interface FilteredServers {
	validServers: SimpleServer[];
	invalidSslServers: InvalidSslServer[];
}

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
): Promise<FilteredServers> => {
	const validServers: SimpleServer[] = [];
	const invalidSslServers: InvalidSslServer[] = [];

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
						validServers.push(server);
						continue server;
					}
				}
				invalidSslServers.push({ server, reason: "missing" });

				continue server;
			}
		}

		const certificate = await parseCertificateFile(
			sslFileFor(server, "cert.pem")
		);

		if (certificate == false) continue server;
		const days = msToDays(certificate.expiry.valueOf() - Date.now());

		if (days < 30) {
			// Certificate expires in less than 30 days
			logger.certificateExpiry({
				serverName: server.server_name,
				days
			});

			invalidSslServers.push({ server, reason: "expired" });
		} else if (certificate.staging && settings.staging == false) {
			console.log("Is Staging");
			invalidSslServers.push({ server, reason: "staging" });
		} else {
			logger.certificateValid({
				serverName: server.server_name,
				days,
				staging: certificate.staging
			});

			validServers.push(server);
		}
	}

	return { invalidSslServers, validServers };
};
