import createConfig from "@lib/createConfig";
import settings from "@utils/settings";

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
		settings.dontDownloadCustomFiles = true;
		return expect(createConfig(fullValidServer)).resolves.toMatchSnapshot();
	});
});
