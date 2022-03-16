import { join } from "path";

import { createDHParams } from "@utils/createDHParams";
import createHash from "@utils/createHash";
import dnsLookup from "@utils/dnsLookup";
import { parseCertificateExpiry } from "@utils/parseCertificateExpiry";
import { parseIntDefault } from "@utils/parseIntDefault";
import { sslFilesFor } from "@utils/sslFilesFor";

describe("Utilities", () => {
	test("Diffie-Hellman parameters", () => {
		const params = createDHParams();

		expect(typeof params).toBe("string");
		expect(params).toHaveLength(419);
	});

	test("Hash", () => {
		const hash = createHash("nginx");

		expect(typeof hash).toBe("string");
		expect(hash).toHaveLength(32);
		expect(hash).toBe("ee434023cf89d7dfb21f63d64f0f9d74");
	});

	test("DNS Lookup", async () => {
		expect(await dnsLookup("example.com")).toBe(true);
		expect(await dnsLookup("false.doesnotexists")).toBe(false);
	});

	test("Parse Certificate Expiry", async () => {
		const [exists, notExisting] = await Promise.all([
			parseCertificateExpiry(
				join(process.cwd(), "src", "tests", "certs", "example.pem")
			),
			parseCertificateExpiry("notExisting.pem")
		]);

		expect(exists).not.toBe(false);
		expect(notExisting).toBe(false);
		if (exists !== false)
			expect(exists.toISO()).toEqual("2013-10-04T14:47:15.000+02:00");
	});

	test("Parse Integer with Default", () => {
		const def = 10;
		expect(parseIntDefault("NaN", def)).toBe(def);
		expect(parseIntDefault("u1", def)).toBe(def);

		expect(parseIntDefault("1", def)).toBe(1);
		expect(parseIntDefault("1u", def)).toBe(1);
	});

	test("Create SSL File Paths for a Servername", () => {
		expect(sslFilesFor({ server_name: "example.com" })).toMatchSnapshot();
	});
});
