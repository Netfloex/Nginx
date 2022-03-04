import asn1 from "asn1.js";
import { createDiffieHellman } from "crypto";

import log from "@utils/log";
import settings from "@utils/settings";

export const createDHParams = (): string => {
	log.creatingDHParams();

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

	log.createdDHParams();

	return dhparam;
};
