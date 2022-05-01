import chalk from "chalk";
import { join } from "path";
import { performance } from "perf_hooks";

import { logger } from "@lib/logger";
import { createDHParams } from "@utils/createDHParams";
import createHash from "@utils/createHash";
import dnsLookup from "@utils/dnsLookup";
import { fixedLength } from "@utils/fixedLength";
import { msToDays } from "@utils/msToDays";
import { parseCertificateExpiry } from "@utils/parseCertificateExpiry";
import { parseIntDefault } from "@utils/parseIntDefault";
import { sslFilesFor } from "@utils/sslFilesFor";
import { startedToSeconds } from "@utils/startedToSeconds";

describe("Utilities", () => {
	logger.overWriteLogFunction = jest.fn().mockName("logger");
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

	test("Fixed Length", () => {
		const length = 50;

		expect(fixedLength("30 Chars", length)).toHaveLength(length);
		const longString =
			"This is a string longer than 30 chars. It should not add spaces";
		expect(fixedLength(longString, length)).toHaveLength(longString.length);
		expect(
			fixedLength(chalk`{blue Even with {bold colors}}`, length)
		).toHaveLength(length);
	});

	test("Milliseconds to days", () => {
		const msPerDay = 1000 * 60 * 60 * 24;
		expect(msToDays(10 * msPerDay)).toBe(10);
		expect(msToDays(5.5 * msPerDay)).toBe(6);
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
			expect(exists.toUTC().toISO()).toEqual("2013-10-04T12:47:15.000Z");
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

	test("Started to seconds", () => {
		expect(
			startedToSeconds(performance.now() - 1100).startsWith("1.1")
			// Will output "1.100", but this is timing related
		).toBeTruthy();
	});
});
