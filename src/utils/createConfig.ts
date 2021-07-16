import ConfigParser, { NginxConfig } from "@webantic/nginx-config-parser";
import { join } from "path";
import SimpleServer, { Location } from "../models/SimpleServer";
import baseConf from "./baseConf";
import createHash from "./createHash";
import downloadCSSToFile from "./downloadCSSToFile";
import downloadJSToFile from "./downloadJSToFile";
import env from "./env";

const parser = new ConfigParser();

const createLocation = async (
	JsonConf: NginxConfig,
	location: Location
): Promise<void> => {
	const locString = `location ${location.location}`;

	if (!JsonConf.server[locString]) {
		JsonConf.server[locString] = {};
	}

	// Proxy Pass
	JsonConf.server[locString].proxy_pass = location.proxy_pass;

	// Websockets
	if (location.websocket) {
		const block =
			location.location == "/"
				? JsonConf.server
				: JsonConf.server[locString];

		block.proxy_set_header = [
			"Upgrade $http_upgrade",
			"Connection $http_connection"
		];

		block.proxy_http_version = 1.1;
	}

	// Custom CSS
	if (location.custom_css.length) {
		const fileNames = location.custom_css.map((g) => createHash(g));

		JsonConf.server[locString].sub_filter = `'</head>' '${fileNames
			.map(
				(hash) =>
					`<link rel="stylesheet" type="text/css" href="/custom_assets/css/${hash}.css">`
			)
			.join("")}</head>'`;

		JsonConf.server["location /custom_assets"] = {
			alias: env.customFilesPath
		};

		await downloadCSSToFile(location.custom_css);
	}

	// Custom JS
	if (location.custom_js.length) {
		const fileNames = location.custom_js.map((g) => createHash(g));

		JsonConf.server[locString].sub_filter = `'</body>' '${fileNames
			.map(
				(hash) => `<script src="/custom_assets/js/${hash}.js"></script>`
			)
			.join("")}</body>'`;

		JsonConf.server["location /custom_assets"] = {
			alias: env.customFilesPath
		};

		await downloadJSToFile(location.custom_js);
	}
};

const createConfig = async (server: SimpleServer): Promise<string> => {
	const JsonConf: NginxConfig = await baseConf();

	// Server Name
	JsonConf.server.server_name = server.server_name;

	// SSL Certificate files
	const sslKeysPath = join("/etc/letsencrypt/live", server.server_name, "/");
	JsonConf.server.ssl_certificate = sslKeysPath + "fullchain.pem";
	JsonConf.server.ssl_certificate_key = sslKeysPath + "privkey.pem";
	JsonConf.server.ssl_trusted_certificate = sslKeysPath + "chain.pem";

	// Mutate JsonConf
	await createLocation(JsonConf, { ...server, location: "/" });

	// Custom Locations
	if (server.locations.length) {
		await Promise.all(
			server.locations.map(async (location) => {
				await createLocation(JsonConf, location);
			})
		);
	}

	const config = parser.toConf(JsonConf);

	return config;
};

export default createConfig;
