import ConfigParser, { NginxLocation } from "@webantic/nginx-config-parser";
import { join } from "path";

import baseConf from "@utils/baseConf";
import createAuthFile from "@utils/createAuthFile";
import createHash from "@utils/createHash";
import downloadCSSToFile from "@utils/downloadCSSToFile";
import downloadJSToFile from "@utils/downloadJSToFile";
import settings from "@utils/settings";

import { Location, SimpleServer, ValidatedServer } from "@models/ParsedConfig";

const parser = new ConfigParser();

const usesCustom = (options: Location | ValidatedServer): boolean =>
	!!(options.custom_css?.length || options.custom_js?.length);

const createLocation = async (location: Location): Promise<NginxLocation> => {
	const block: NginxLocation = {};
	// Proxy Pass
	if (location.proxy_pass) {
		block.proxy_pass = location.proxy_pass;
		block.include ??= [];
		block.include.push(join(settings.nginxIncludePath, "proxy_pass.conf"));
	}

	// Return
	if (location.return) block.return = location.return;

	if (location.redirect) block.return = `301 ${location.redirect}`;

	if (location.rewrite) block.rewrite = location.rewrite;

	if (location.html) {
		block.return = `200 "${location.html}"`;
		location.headers ??= {};
		location.headers["Content-Type"] = "text/html";
	}

	if (location.websocket) {
		// Websocket
		block.proxy_set_header ??= [];
		block.proxy_set_header.push(
			"Upgrade $http_upgrade",
			"Connection $http_connection"
		);

		block.proxy_http_version = 1.1;
	}

	if (usesCustom(location)) {
		// Custom Files
		block.sub_filter = [];

		// Custom CSS
		if (location.custom_css?.length) {
			const fileNames = location.custom_css.map((g) => createHash(g));

			block.sub_filter.push(
				`'</head>' '${fileNames
					.map(
						(hash) =>
							`<link rel="stylesheet" type="text/css" href="/custom_assets/css/${hash}.css">`
					)
					.join("")}</head>'`
			);

			if (!settings.dontDownloadCustomFiles)
				await downloadCSSToFile(location.custom_css);
		}

		// Custom JS
		if (location.custom_js?.length) {
			const fileNames = location.custom_js.map((g) => createHash(g));

			block.sub_filter.push(
				`'</body>' '${fileNames
					.map(
						(hash) =>
							`<script src="/custom_assets/js/${hash}.js"></script>`
					)
					.join("")}</body>'`
			);

			if (!settings.dontDownloadCustomFiles)
				await downloadJSToFile(location.custom_js);
		}
	}

	// Headers
	const headerEntries = Object.entries(location.headers ?? {});

	if (headerEntries.length) {
		block.add_header = headerEntries.map((header) => header.join(" "));
	}

	// Auth

	if (location.auth) {
		const { filename, hash } = await createAuthFile(location.auth);
		block.auth_basic = hash;
		block.auth_basic_user_file = filename;
	}

	return block;
};

const createConfig = async (
	server: Omit<SimpleServer, "filename">
): Promise<string> => {
	const { server: jsonServer } = await baseConf();

	// Server Name
	jsonServer.server_name = server.server_name;

	// SSL Certificate files
	const sslKeysPath = join(
		"/etc/letsencrypt/live",
		server.certbot_name ?? server.server_name,
		"/"
	);
	jsonServer.ssl_certificate = sslKeysPath + "fullchain.pem";
	jsonServer.ssl_certificate_key = sslKeysPath + "privkey.pem";
	jsonServer.ssl_trusted_certificate = sslKeysPath + "chain.pem";
	jsonServer.ssl_dhparam = "/etc/letsencrypt/dhparams/dhparam.pem";

	jsonServer["location /"] = await createLocation({
		...server,
		location: "/"
	});

	if (Object.entries(jsonServer["location /"]).length == 0) {
		delete jsonServer["location /"];
	}

	// Custom Locations
	if (server.locations?.length) {
		await Promise.all(
			server.locations.map(async (location) => {
				jsonServer[`location ${location.location}`] =
					await createLocation(location);
			})
		);
	}

	if (usesCustom(server)) {
		jsonServer["location /custom_assets"] = {
			alias: settings.customFilesPath
		};
	}

	const config = parser.toConf({
		server: jsonServer
	});

	return config;
};

export default createConfig;
