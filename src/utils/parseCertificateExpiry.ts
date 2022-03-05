import { pathExists, readFile } from "fs-extra";
import { DateTime } from "luxon";
import { pki } from "node-forge";

import log from "@utils/log";

export const parseCertificateExpiry = async (
	certificateFile: string
): Promise<DateTime | false> => {
	if (!(await pathExists(certificateFile))) {
		log.certificateParseFailed(certificateFile, "The file does not exists");
		return false;
	}

	const certificate = await readFile(certificateFile, "utf-8");

	try {
		const cert = pki.certificateFromPem(certificate);
		return DateTime.fromJSDate(cert.validity.notAfter);
	} catch (error) {
		if (error instanceof Error)
			log.certificateParseFailed(certificateFile, error.message);
		else console.error(error);
		return false;
	}
};
