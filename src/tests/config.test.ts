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
					dns_error: "http://not-existing",
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
						locations: {
							empty: {},
							invalid: "invalid url",
							extra: {
								// @ts-expect-error missing password
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

	test("It accepts a valid config", async () => {
		const value = await validateConfig({
			servers: {
				"example.com": {
					auth: {
						password: "password",
						username: "username"
					},
					certbot_name: "string",
					cors: "*",
					custom_css: "http://validurlstring",
					custom_js: ["http://validurlarray"],
					headers: {
						"Content-Type": "text/html"
					},
					html: "html string",
					locations: {
						direct: "http://example.com",
						indirect: {
							proxy_pass: "http://example.com"
						}
					},
					subdomains: {
						www: "http://example.com",

						// return options
						redirects: {
							redirect: "/"
						},
						returns: {
							return: "200 ok"
						},
						rewrites: {
							rewrite: "^ https://example.com"
						},

						no_return_allowed: {
							locations: {
								"/en": {
									html: "Return not needed in subdomain"
								}
							}
						}
					},
					websocket: true
				}
			}
		});
		if (value == null) {
			console.log(mocked.mock.calls.flat());
		}
		expect(value).not.toBe(null);
		expect(value).toMatchSnapshot();
	});
});
