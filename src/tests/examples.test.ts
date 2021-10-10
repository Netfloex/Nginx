import chalk from "chalk";
import { readdirSync } from "fs";
import { join } from "path";
import { rcFile } from "rc-config-loader";
import { mocked } from "ts-jest/utils";

import validateConfig from "@lib/validateConfig";
import log from "@utils/log";
import settings from "@utils/settings";

chalk.level = 0;

describe("The examples should be valid", () => {
	log.log = jest.fn().mockName("log.log");
	const mockedLog = mocked(log.log);

	const examples = readdirSync(settings.configPath).filter((file) =>
		file.match(/example/)
	);

	examples.forEach((example) => {
		test(example, async () => {
			settings.dontCheckDns = true;
			const results = rcFile("config", {
				configFileName: join(settings.configPath, example)
			});

			expect(results).not.toBeNull();
			if (!results) return;

			const value = await validateConfig(results.config);

			if (value == null) {
				console.log(mockedLog.mock.calls.flat());
			}

			expect(value).not.toBe(null);
		});
	});
});
