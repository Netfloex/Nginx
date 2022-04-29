import { readdirSync } from "fs-extra";
import { join } from "path";

import { logger } from "@lib/logger";
import validateConfig from "@lib/validateConfig";
import parseUserConfig from "@utils/parseUserConfig";
import settings from "@utils/settings";

describe("The examples should be valid", () => {
	logger.overWriteLogFunction = jest.fn().mockName("logger");
	logger.disableTime = true;
	const mockedLog = jest.mocked(logger.overWriteLogFunction);

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
