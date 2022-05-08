import asn1 from "asn1.js";
import { createDiffieHellman } from "crypto";
import { performance } from "perf_hooks";

import { logger } from "@lib/logger";
import settings from "@utils/settings";

/**
 * Creates Diffie-Hellman parameters
 * This function is synchronous but can take a long time
 * @returns {string} Diffie-Hellman Parameters
 */

export const createDHParams = (): string => {
	logger.creatingDHParams();
	const started = performance.now();
	const dhparam = asn1
		.define("", function () {
			this.seq().obj(this.key("p").int(), this.key("g").int());
		})
		.encode(
			{
				p: createDiffieHellman(settings.dhParamSize).getPrime(),
				g: 2
			},
			"pem",
			{ label: "DH PARAMETERS" }
		);

	logger.createdDHParams({ started });

	return dhparam;
};
