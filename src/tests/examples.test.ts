import chalk from "chalk";
import { readdirSync } from "fs-extra";
import { join } from "path";
import { mocked } from "ts-jest/utils";

import validateConfig from "@lib/validateConfig";
import log from "@utils/log";
import parseUserConfig from "@utils/parseUserConfig";
import settings from "@utils/settings";

chalk.level = 0;

describe("The examples should be valid", () => {
	log.log = jest.fn().mockName("log.log");
	const mockedLog = mocked(log.log);

	const examples = readdirSync(settings.configPath)
		.filter((file) => file.match(/example/))
		.map((file) => join(settings.configPath, file));

	examples.forEach((example) => {
		test(example, async () => {
			settings.dontCheckDns = true;
			const results = await parseUserConfig(example);

			expect(results).not.toBe(false);
			if (!results) return;

			const value = await validateConfig(results);

			if (value == null) {
				console.log(mockedLog.mock.calls.flat());
			}

			expect(value).not.toBe(null);
		});
	});
});
