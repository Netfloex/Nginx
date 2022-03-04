import { pathExists } from "fs-extra";

import log from "@utils/log";
import { parseCertificateExpiry } from "@utils/parseCertificateExpiry";
import { sslFilesFor } from "@utils/sslFilesFor";

import { SimpleServer } from "@models/ParsedConfig";

export const filterServersWithValidSslFiles = async (
	servers: SimpleServer[],
	last = false
): Promise<SimpleServer[]> => {
	const out: SimpleServer[] = [];

	server: for (const server of servers) {
		const sslFilePaths = Object.values(sslFilesFor(server));

		for (const file of sslFilePaths) {
			if (!(await pathExists(file))) {
				// File does not exists
				log.missingSslFiles(server.server_name, last);
				continue server;
			}
		}
		const days = (await parseCertificateExpiry(sslFilePaths[0]))
			.diffNow()
			.as("days");

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
