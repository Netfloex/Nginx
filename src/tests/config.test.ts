import chalk from "chalk";

import validateConfig from "@lib/validateConfig";
import log from "@utils/log";

chalk.level = 0;

describe("Validate Config", () => {
	log.log = jest.fn().mockName("log.log");
	const mocked = log.log as jest.MockedFunction<typeof log.log>;
	test("It checks for an invalid config", async () => {
		expect(
			await validateConfig({
				// @ts-expect-error boolean
				cloudflare: "false",
				servers: {
					"example.com": {
						proxy_pass: "invalid url",
						auth: {
							// @ts-expect-error unknown
							unknown: "",
							username: ":",
							password: ""
						},
						// @ts-expect-error string
						certbot_name: [],
						cors: "/",
						// @ts-expect-error string[] | string
						custom_css: {},
						custom_js: ["invalid url"],
						// @ts-expect-error object
						headers: [],
						// @ts-expect-error string
						html: [],
						// @ts-expect-error object
						locations: {
							empty: {},
							invalid: "invalid url",
							extra: {
								auth: {
									username: ""
								}
							}
						},
						// @ts-expect-error string
						redirect: [],
						// @ts-expect-error string
						return: [],
						// @ts-expect-error string
						rewrite: [],
						subdomains: {}
					}
				},
				unknown: ""
			})
		).toBe(null);

		expect(mocked.mock.calls.flat()).toMatchSnapshot();
	});

	test("It tests for invalid number of return types", async () => {
		expect(
			await validateConfig({
				servers: {
					"example.com": {
						proxy_pass: "http://example",
						html: "too many return types",
						redirect: "https://example.com/redirect",
						rewrite: "^ https://example.com/rewrite",
						return: "500 too many"
					},
					"no returns": {}
				}
			})
		).toBe(null);

		expect(mocked.mock.calls.flat()).toMatchSnapshot();
	});
});
