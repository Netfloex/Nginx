import { replaceCurrentDir } from "./test-utils";

import { logger } from "@lib/logger";
import validateConfig from "@lib/validateConfig";

import fullErrorConfig from "@configs/full-error-config.json";
import fullValidConfig from "@configs/full-valid-config.json";
import invalidReturnTypesConfig from "@configs/invalid-return-types-config.json";

describe("Validate Config", () => {
	logger.overWriteLogFunction = jest.fn().mockName("logger");

	const mockedLog = jest.mocked(logger.overWriteLogFunction);

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
		expect(
			JSON.parse(replaceCurrentDir(JSON.stringify(value)))
		).toMatchSnapshot();
	});
});
