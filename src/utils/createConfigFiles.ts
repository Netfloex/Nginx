import { outputFile } from "fs-extra";
import { join } from "path";

import createConfig from "@lib/createConfig";
import { logger } from "@lib/logger";
import settings from "@utils/settings";

import { SimpleServer } from "@models/ParsedConfig";

export const createConfigFiles = (
	servers: SimpleServer[],
	defaultUsername: string | undefined
): Promise<void>[] => {
	return servers.map(async (server, i) => {
		const nginxConfig = await createConfig(server, defaultUsername);

		const fileName =
			join(settings.nginxConfigPath, `${i}-${server.filename}`) + ".conf";

		await outputFile(fileName, nginxConfig);

		logger.configDone({ serverName: server.server_name });
	});
};
