import { parse } from "cert2json";
import { pathExists, readFile } from "fs-extra";

import { logger } from "@lib/logger";

/**
 * Parses a certificate file
 * Returns useful information
 * or false if the file does not exist
 * @param certificateFile The path to the certificate
 * @returns An object containing expiry and whether the certificate is staging
 */

export interface ParsedCertificate {
	expiry: Date;
	staging: boolean;
}

export const parseCertificateFile = async (
	certificateFile: string
): Promise<ParsedCertificate | false> => {
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
		return {
			expiry: cert.tbs.validity.notAfter,
			staging: cert.tbs.issuer.full.includes("STAGING")
		};
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
