import { pathExists } from "fs-extra";

import { logger } from "@lib/logger";
import { msToDays } from "@utils/msToDays";
import { parseCertificateFile } from "@utils/parseCertificateFile";
import settings from "@utils/settings";
import { sslFileFor, sslFilesFor } from "@utils/sslFilesFor";

import { SimpleServer } from "@models/ParsedConfig";

export type InvalidSslReason = "expired" | "staging" | "missing";

export interface InvalidSslServer {
	server: SimpleServer;
	staging?: boolean;
	reason: InvalidSslReason;
}

export interface FilteredServers {
	validServers: SimpleServer[];
	invalidSslServers: InvalidSslServer[];
}

/**
 * Returns a list of servers which has valid certificates
 * Valid means:
 * - All files exists
 * - The certificate does not expire within 30 days
 * - Is not using the staging environment (allowed when STAGING=1)
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
					logger.certificateFailed({
						serverName: server.server_name,
						reason: "missing"
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
			if (last)
				logger.certificateFailed({
					serverName: server.server_name,
					reason: "expired"
				});
			else
				logger.certificateExpiry({
					serverName: server.server_name,
					days
				});

			invalidSslServers.push({
				server,
				reason: "expired",
				staging: certificate.staging
			});
		} else if (certificate.staging && settings.staging == false) {
			// It is a staging certificate *and* we are not using the staging environment

			if (last)
				logger.certificateFailed({
					serverName: server.server_name,
					reason: "staging"
				});
			else
				logger.certificateStaging({
					serverName: server.server_name
				});

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
