import chalk from "chalk";
import { mocked } from "ts-jest/utils";

import validateConfig from "@lib/validateConfig";
import log from "@utils/log";

import fullErrorConfig from "@configs/full-error-config.json";
import fullValidConfig from "@configs/full-valid-config.json";
import invalidReturnTypesConfig from "@configs/invalid-return-types-config.json";

chalk.level = 0;

describe("Validate Config", () => {
	log.log = jest.fn().mockName("log.log");
	const mockedLog = mocked(log.log);

	test("It checks for an invalid config", async () => {
		expect(await validateConfig(fullErrorConfig)).toBe(null);

		expect(mockedLog.mock.calls.flat()).toMatchSnapshot();
	});

	test("It tests for invalid number of return types", async () => {
		expect(await validateConfig(invalidReturnTypesConfig)).toBe(null);

		expect(mockedLog.mock.calls.flat()).toMatchSnapshot();
	});

	test("It accepts a valid config", async () => {
		const value = await validateConfig(fullValidConfig);
		if (value == null) {
			console.log(mockedLog.mock.calls.flat());
		}
		expect(value).not.toBe(null);
		expect(value).toMatchSnapshot();
	});
});
