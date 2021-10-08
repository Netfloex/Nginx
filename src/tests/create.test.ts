import createConfig from "@lib/createConfig";
import settings from "@utils/settings";

import fullValidServer from "@configs/full-valid-server.json";

const replaceCurrentDir = (config: string): string => {
	return config.replace(new RegExp(process.cwd(), "g"), "/current");
};

describe("Create config", () => {
	test("Base Config", async () => {
		expect(
			replaceCurrentDir(
				await createConfig({
					server_name: "example.com"
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
