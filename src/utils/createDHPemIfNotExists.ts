import { outputFile, pathExists } from "fs-extra";

import { createDHParams } from "@utils/createDHParams";
import log from "@utils/log";
import settings from "@utils/settings";

export const createDHPemIfNotExists = async (): Promise<void> => {
	if (await pathExists(settings.dhParamPath)) return;
	if (await pathExists(settings.letsencryptPath))
		await outputFile(settings.dhParamPath, createDHParams());
	else log.letsencryptNoPath();
};
