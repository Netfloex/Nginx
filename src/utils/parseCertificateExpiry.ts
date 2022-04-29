import { parse } from "cert2json";
import { pathExists, readFile } from "fs-extra";
import { DateTime } from "luxon";

import { logger } from "@lib/logger";

export const parseCertificateExpiry = async (
	certificateFile: string
): Promise<DateTime | false> => {
	if (!(await pathExists(certificateFile))) {
		logger.certificateParseFailed({
			file: certificateFile,
			error: "The file does not exists"
		});
		return false;
	}

	const certificate = await readFile(certificateFile, "utf-8");

	try {
		const cert = parse(certificate);
		return DateTime.fromJSDate(cert.tbs.validity.notAfter);
	} catch (error) {
		if (error instanceof Error)
			logger.certificateParseFailed({
				file: certificateFile,
				error: error.stack ?? error.message
			});
		else console.error(error);
		return false;
	}
};
