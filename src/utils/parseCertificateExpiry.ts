import { readFile } from "fs-extra";
import { DateTime } from "luxon";
import { pki } from "node-forge";

export const parseCertificateExpiry = async (
	certificateFile: string
): Promise<DateTime> => {
	const certificate = await readFile(certificateFile, "");

	try {
		const cert = pki.certificateFromPem(certificate);
		return DateTime.fromJSDate(cert.validity.notAfter);
	} catch (error) {
		console.error(error);
		return DateTime.fromMillis(0);
	}
};
