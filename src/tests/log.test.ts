import { replaceCurrentDir } from "./test-utils";
import { performance } from "perf_hooks";

import { logger } from "@lib/logger";

describe("Logger", () => {
	logger.overWriteLogFunction = jest.fn().mockName("logger");
	performance.now = jest.fn(() => 0).mockName("performance.now");
	const mockedLog = jest.mocked(logger.overWriteLogFunction);
	test("All log Messages", () => {
		Object.values(logger).forEach((log) => log({} as never));
		expect(mockedLog).toBeCalledTimes(Object.values(logger).length);

		expect(
			mockedLog.mock.calls.flat().map((msg) => replaceCurrentDir(msg))
		).toMatchSnapshot();
	});
});
