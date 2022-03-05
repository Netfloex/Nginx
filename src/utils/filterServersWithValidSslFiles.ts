import { pathExists } from "fs-extra";

import log from "@utils/log";
import { parseCertificateExpiry } from "@utils/parseCertificateExpiry";
import { sslFileFor, sslFilesFor } from "@utils/sslFilesFor";

import { SimpleServer } from "@models/ParsedConfig";

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
				log.missingSslFiles(server.server_name, last);
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
			log.certificateExpiresIn(server.server_name, Math.round(days));
			continue server;
		}

		log.certificateValid(server, days);

		out.push(server);
	}

	return out;
};
