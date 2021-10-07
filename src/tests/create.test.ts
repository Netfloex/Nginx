import createConfig from "@lib/createConfig";
import { dontDownloadCustomFiles } from "@utils/env";

import fullValidServer from "@configs/full-valid-server.json";

describe("Create config", () => {
	test("Base Config", () => {
		return expect(
			createConfig({
				server_name: "example.com"
			})
		).resolves.toMatchSnapshot();
	});

	test("Full Server", () => {
		// @ts-expect-error import
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		dontDownloadCustomFiles = true;
		return expect(createConfig(fullValidServer)).resolves.toMatchSnapshot();
	});
});
