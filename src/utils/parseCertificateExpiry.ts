import { readFile } from "fs-extra";
import { DateTime } from "luxon";
import { pki } from "node-forge";

import log from "@utils/log";

export const parseCertificateExpiry = async (
	certificateFile: string
): Promise<DateTime | false> => {
	const certificate = await readFile(certificateFile, "");

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
