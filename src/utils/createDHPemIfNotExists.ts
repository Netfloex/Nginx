import { outputFile, pathExists } from "fs-extra";

import { logger } from "@lib/logger";
import { createDHParams } from "@utils/createDHParams";
import settings from "@utils/settings";

/**
 * Creates a `dhparam.pem` only if it does not exists yet.
 *
 * It's contents are created by {@link createDHParams}
 */

export const createDHPemIfNotExists = async (): Promise<void> => {
	if (await pathExists(settings.dhParamPath)) return;
	if (await pathExists(settings.letsencryptPath))
		await outputFile(settings.dhParamPath, createDHParams());
	else {
		logger.noLetsencryptDir();
		logger.noDHParams();
	}
};
