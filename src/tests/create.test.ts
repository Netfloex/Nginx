import { replaceCurrentDir } from "./test-utils";

import createConfig from "@lib/createConfig";
import settings from "@utils/settings";

import fullValidServer from "@configs/full-valid-server.json";

describe("Create config", () => {
	test("Base Config", async () => {
		expect(
			replaceCurrentDir(
				await createConfig({
					server_name: "example.com",
					port: 443,
					ssl: true
				})
			)
		).toMatchSnapshot();
	});

	test("Full Server", async () => {
		settings.dontDownloadCustomFiles = true;
		expect(
			replaceCurrentDir(await createConfig(fullValidServer))
		).toMatchSnapshot();
	});
});
