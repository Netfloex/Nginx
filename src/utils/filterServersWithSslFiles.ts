import { pathExists } from "fs-extra";

import log from "@utils/log";
import { sslFilesFor } from "@utils/sslFilesFor";

import { SimpleServer } from "@models/ParsedConfig";

export const filterServersWithSslFiles = async (
	servers: SimpleServer[],
	last = false
): Promise<SimpleServer[]> => {
	const out: SimpleServer[] = [];

	server: for (const server of servers) {
		const sslFilePaths = Object.values(sslFilesFor(server));

		for (const file of sslFilePaths) {
			if (!(await pathExists(file))) {
				log.missingSslFiles(server.server_name, last);
				continue server;
			}
		}

		out.push(server);
	}

	return out;
};
