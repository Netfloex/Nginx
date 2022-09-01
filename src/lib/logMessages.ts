import chalk, { Chalk } from "chalk";
import { YAMLException } from "js-yaml";
import { ZodIssue } from "zod";

import { Log, Tag } from "@lib/logger";
import { InvalidSslReason } from "@utils/filterServersWithValidSslFiles";
import { formatAxiosError } from "@utils/formatAxiosError";
import { formatError } from "@utils/formatError";
import { gradientNumber } from "@utils/gradientNumber";
import { msToDays } from "@utils/msToDays";
import { plural } from "@utils/plural";
import settings from "@utils/settings";
import { startedToSeconds } from "@utils/startedToSeconds";

import { SimpleServer } from "@models/ParsedConfig";

/* 
	Typescript helper function
	Input must be a valid Log Item
	Output type is inferred
*/

export const defineLogList = <
	T extends Record<
		string,
		(vars: never) => [logType: Log, logTag: Tag, message: string]
	>
>(
	list: T
): T => list;

export const logMessages = defineLogList({
	// Global

	start: () => [
		Log.info, //
		Tag.main,
		chalk.green`Started`
	],
	done: ({
		started = 0,
		configsCreated
	}: {
		started: number;
		configsCreated?: number;
	}) => {
		return [
			Log.done,
			Tag.main,
			chalk`{green Done} ${
				configsCreated !== undefined
					? chalk`created {bold ${(configsCreated == 0
							? chalk.red
							: chalk.green)(configsCreated)}} configs `
					: ""
			}in {yellow ${startedToSeconds(started)}s}`
		];
	},
	exited: ({ started = 0 }: { started: number }) => [
		Log.error,
		Tag.main,
		chalk`{red Exited} in {yellow ${startedToSeconds(started)}s}`
	],
	exception: () => [
		Log.error,
		Tag.main,
		chalk`An unexpected error occurred:`
	],

	// Old configurations

	removeOldConfigs: () => [
		Log.info,
		Tag.nginx,
		chalk`{yellow Removing old generated configs...} {dim ${settings.nginxConfigPath}}`
	],

	noOldConfigs: () => [
		Log.error,
		Tag.nginx,
		chalk`{red Nginx Config Path not found:} {dim ${settings.nginxConfigPath}}`
	],
	configsLocationHint: () => [
		Log.info,
		Tag.nginx,
		chalk`You can set {dim NGINX_CONFIG_PATH} env variable to customize this location.`
	],

	nginxConfNotFound: ({ nginxPath }: { nginxPath: string }) => [
		Log.warn,
		Tag.nginx,
		chalk`Could not find nginx.conf: {dim ${nginxPath}}`
	],

	// Certbot and certificates

	noCertbotEmail: () => [
		Log.error,
		Tag.certbot,
		chalk`{red You must set the {reset {dim CERTBOT_EMAIL}} environment variable, certbot can not run without it.}`
	],
	noCertbotBinary: () => [
		Log.error,
		Tag.certbot,
		chalk`Certbot binary not found`
	],
	allValid: () => [
		Log.info,
		Tag.certbot,
		chalk`All domains have their valid certificates, skipping certbot.`
	],
	certbotDisabled: () => [
		Log.info, //
		Tag.certbot,
		chalk`Certbot is disabled.`
	],
	skippingCertbot: () => [
		Log.info,
		Tag.certbot,
		chalk`Skipped requesting certificates`
	],
	requestingCertificates: ({ count = -1 }: { count: number }) => [
		Log.info,
		Tag.certbot,
		chalk`{yellow Requesting certificates for {dim ${count}} domain${plural(
			count
		)}}${
			!settings.staging
				? chalk`{yellow ...}`
				: chalk`, using {bold Staging} environment`
		}`
	],
	certbotLog: ({
		index = -1,
		size = -1,
		certificate,
		log
	}: {
		index: number;
		size: number;
		certificate: string;
		log: string;
	}) => [
		Log.log,
		Tag.certbot,
		chalk`[{yellow ${
			index + 1
		}}/{yellow ${size}}] ${certificate}: {dim ${log}}`
	],
	certbotError: ({ messages = [] }: { messages: string[] }) => [
		Log.error,
		Tag.certbot,
		chalk`{red Certbot ran into an error:}\n {dim ${messages.join("\n")}}`
	],
	missingSSLFiles: ({ serverName }: { serverName: string }) => [
		Log.info,
		Tag.certbot,
		chalk`{yellow The server {dim ${serverName}} has missing certificate files, requesting...}`
	],
	certificateFailed: ({
		serverName,
		reason
	}: {
		serverName: string;
		reason: InvalidSslReason;
	}) => [
		Log.error,
		Tag.certbot,
		chalk`{red The certificate files for {dim ${serverName}} could not be ${
			reason == "missing" ? "created" : "renewed"
		}${
			settings.disableCertbot
				? " because certbot is disabled."
				: !settings.certbotMail
				? chalk` because {white {dim CERTBOT_EMAIL}} is not set.`
				: ". This might be because of an error stated above."
		}} ${
			settings.enableConfigMissingCerts
				? chalk`This domain will still be {bold enabled}`
				: "This domain is now disabled."
		}`
	],
	certificateValid: ({
		serverName,
		days = -1,
		staging
	}: {
		serverName: string;
		days: number;
		staging: boolean;
	}) => [
		Log.info,
		Tag.certbot,
		chalk`The certificate for {dim ${serverName}}${
			staging ? chalk` ({yellow staging})` : ""
		} is valid for {bold ${gradientNumber(Math.round(days), 0, 90)}} days`
	],
	certificateExpiry: ({
		serverName,
		days = -1
	}: {
		serverName: string;
		days: number;
	}) => {
		const hasExpired = days <= 0;

		return [
			Log.info,
			Tag.certbot,
			chalk`{yellow The certificate for {dim ${serverName}}, ${
				hasExpired
					? // Negative for expired
					  chalk`expired {red {bold ${-Math.round(days)}}} days ago`
					: chalk`expires in {bold ${gradientNumber(
							Math.round(days),
							30,
							90
					  )}} days`
			}}`
		];
	},
	certificateStaging: ({ serverName }: { serverName: string }) => [
		Log.info,
		Tag.certbot,
		chalk`{yellow The certificate for {dim ${serverName}} is using the {yellow Staging} environment, renewing for production.}`
	],
	certificateParseFailed: ({
		file,
		error
	}: {
		file: string;
		error: string;
	}) => [
		Log.error,
		Tag.certbot,
		chalk`Parsing of the certificate {dim ${file}} failed: {dim ${error}}`
	],
	creatingDHParams: () => [
		Log.info,
		Tag.dhParams,
		chalk`{yellow Creating a {dim ${settings.dhParamSize}} bit Diffie-Hellman parameter...} This could take a while.`
	],
	createdDHParams: ({ started }: { started: number }) => [
		Log.done,
		Tag.dhParams,
		chalk`Diffie-Hellman parameters are created successfully, took {yellow ${startedToSeconds(
			started
		)}} seconds. {dim ${settings.dhParamPath}}`
	],
	noLetsencryptDir: () => [
		Log.error,
		Tag.dhParams,
		chalk`Could not find the letsencrypt directory: {dim ${settings.letsencryptPath}}`
	],
	noDHParams: () => [
		Log.error,
		Tag.dhParams,
		chalk`So the Diffie-Hellman parameter could not be created at {dim ${settings.dhParamPath}}`
	],

	// Nginx Config

	configDone: ({ server = {} as SimpleServer }: { server: SimpleServer }) => {
		let arrowColor: Chalk | (() => "") = (): "" => "";
		let addition = "";

		if (server.proxy_pass) {
			arrowColor = chalk.yellow.bold;
			addition = server.proxy_pass;
			if (server.websocket) {
				addition += chalk.reset.yellow(" (WS)");
			}
		} else if (server.static) {
			arrowColor = chalk.blue.bold;
			addition = server.static;
		} else if (server.html) {
			arrowColor = chalk.green.bold;
			addition =
				server.html.length >= 10
					? `${server.html.slice(0, 10)}...`
					: server.html;
		} else if (server.redirect) {
			arrowColor = chalk.cyan.bold;
			addition = server.redirect;
		}

		return [
			Log.done,
			Tag.nginx,
			[
				chalk.dim(server.server_name),
				arrowColor(">"),
				chalk.dim(addition)
			]
				.filter(Boolean)
				.join(" ")
		];
	},

	// User Config

	configNotFound: ({ path }: { path: string }) => [
		Log.error,
		Tag.config,
		chalk`{red There is no config file in: } {dim ${path}}`
	],
	configFolderNotFound: ({ path }: { path: string }) => [
		Log.error,
		Tag.config,
		chalk`{red The config {bold folder} was not found:} {dim ${path}}`
	],
	multipleConfigs: ({ configs = [] }: { configs: string[] }) => [
		Log.warn,
		Tag.config,
		chalk`Multiple config files were found, using {yellow ${configs[0]}}`
	],
	invalidConfig: ({ plural }: { plural: boolean }) => [
		Log.error,
		Tag.config,
		chalk`There was an issue with your config, the error${
			plural ? "s" : ""
		} ${plural ? "are" : "is"} listed below.`
	],
	configError: ({ config }: { config: string }) => [
		Log.error,
		Tag.config,
		chalk`There was an error parsing the config, please check {dim ${config}}`
	],
	configYamlError: ({
		error = { mark: {} } as YAMLException
	}: {
		error: YAMLException;
	}) => [
		Log.error,
		Tag.config,
		chalk`Yaml Error: {dim ${error.reason}}:\n${error.mark.snippet}`
	],
	configJSONError: ({ error }: { error: unknown }) => [
		Log.error,
		Tag.config,
		chalk`JSON Error: ${formatError(error)}`
	],
	configJSError: ({ error }: { error: unknown }) => [
		Log.error,
		Tag.config,
		chalk`JS Error: ${formatError(error)}`
	],
	configJSInvalidType: ({
		type,
		expected = []
	}: {
		type: string;
		expected: string[];
	}) => [
		Log.error,
		Tag.config,
		chalk`The JS file returned {dim ${type}}, expected ${expected
			.map((str) => chalk`{dim ${str}}`)
			.join(" or ")}`
	],
	configEmpty: ({ config }: { config: string }) => [
		Log.error,
		Tag.config,
		chalk`The config is empty. {dim ${config}}`
	],
	configIssue: ({
		issue = {
			path: []
		} as never
	}: {
		issue: ZodIssue;
	}) => {
		const path =
			issue.path.map((path) => chalk.dim(path)).join(".") || "config";

		return [
			Log.error,
			Tag.config,
			chalk`{magenta Path}: ${path}\n{magenta Error}: {dim ${issue.message}}`
		];
	},
	configValid: ({ file }: { file: string }) => [
		Log.info,
		Tag.config,
		chalk`Config is valid {dim ${file}}`
	],
	configENVNotFound: ({ envKey, env }: { envKey: string; env: string }) => [
		Log.warn,
		Tag.config,
		chalk`Config contains {dim ${envKey}}, while {dim process.env.${env}} was not defined.`
	],
	configPromise: () => [
		Log.info,
		Tag.config,
		chalk`Config is a promise, waiting until it resolves.`
	],

	warnNoHost: ({ host }: { host: string }) => [
		Log.warn,
		Tag.config,
		chalk`Could not resolve {yellow ${host}}, normally this would exit.`
	],
	warnPathNotFound: ({ path }: { path: string }) => [
		Log.warn,
		Tag.config,
		chalk`The path {dim ${path}} could not be found, but since you are using the standalone version you might not need it in this container.`
	],

	// CSS

	downloadCSS: ({ url }: { url: string }) => [
		Log.info,
		Tag.css,
		chalk`{yellow Downloading CSS file...} {dim ${url}}`
	],
	cachedCSS: ({ url }: { url: string }) => [
		Log.done,
		Tag.css,
		chalk`{blue CSS file is cached}, skipping: {dim ${url}}`
	],
	downloadedCSS: ({ url }: { url: string }) => [
		Log.done,
		Tag.css,
		chalk`{blue Downloaded CSS file} {dim ${url}}`
	],
	CSSError: ({ url, error }: { url: string; error: string }) => [
		Log.error,
		Tag.css,
		chalk`{red There was an error downloading/compressing the url:} {dim ${url}}\n{dim ${error}}`
	],
	CSSWriteError: ({
		filepath,
		error
	}: {
		filepath: string;
		error: unknown;
	}) => [
		Log.error,
		Tag.css,
		chalk`{red Could not save the CSS file} {dim ${filepath}}\n${formatError(
			error
		)}`
	],

	// JS

	downloadJS: ({ url }: { url: string }) => [
		Log.info,
		Tag.js,
		chalk`{yellow Downloading JS file...} {dim ${url}}`
	],
	cachedJS: ({ url }: { url: string }) => [
		Log.done,
		Tag.js,
		chalk`{blue JS file is already downloaded}, skipping: {dim ${url}}`
	],
	downloadedJS: ({ url }: { url: string }) => [
		Log.done,
		Tag.js,
		chalk`{blue Downloaded JS file} {dim ${url}}`
	],
	jsError: ({ error }: { error: unknown }) => [
		Log.error,
		Tag.js,
		formatAxiosError(error)
	],

	// Cloudflare

	updatingCloudflare: () => [
		Log.info,
		Tag.cloudflare,
		chalk`{yellow Updating Cloudflare ip list...}`
	],
	cloudflareCached: ({ timeAgo = 0 }: { timeAgo: number }) => {
		const days = msToDays(timeAgo);

		return [
			Log.info,
			Tag.cloudflare,
			chalk`Using cache: current ip list has been updated ${
				days == 0
					? "today"
					: `${gradientNumber(days, 0, 9, true)} day${plural(
							days
					  )} ago`
			}`
		];
	},
	cloudflareExpired: () => [
		Log.info,
		Tag.cloudflare,
		chalk`Cloudflare ip list expired, Cache duration: {dim ${msToDays(
			settings.cloudflareExpiry
		)}} days`
	],
	cloudflareUpdated: ({ started }: { started: number }) => [
		Log.done,
		Tag.cloudflare,
		chalk`Updated Cloudflare ip list {dim Request took {yellow ${startedToSeconds(
			started
		)}s}}`
	],
	cloudflareUnchanged: ({ started }: { started: number }) => [
		Log.info,
		Tag.cloudflare,
		chalk`Cloudflare ip list refreshed, no changes with cache {dim Request took {yellow ${startedToSeconds(
			started
		)}s}}`
	],
	cloudflareDone: ({ length }: { length: number }) => [
		Log.done,
		Tag.cloudflare,
		chalk`Cloudflare ip list has been generated. Added {dim ${length}} ip addresses.`
	],
	cloudflareAxiosError: ({ error }: { error: unknown }) => [
		Log.error,
		Tag.cloudflare,
		formatAxiosError(error)
	],

	// Environment

	parseIntFailed: ({ string, or }: { string: string; or: number }) => [
		Log.warn,
		Tag.env,
		chalk`Could not parse {dim ${string}} to a number, defaulting to ${or}`
	]
} as const);
