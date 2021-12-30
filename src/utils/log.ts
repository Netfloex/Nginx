/* eslint-disable @typescript-eslint/explicit-function-return-type */
import chalk from "chalk";
import { YAMLException } from "js-yaml";
import { ZodIssue } from "zod";

import settings from "@utils/settings";

class Log {
	public log;

	constructor() {
		this.log = (...msgs: string[]) =>
			console.log(chalk`[{blue NCM}] ${msgs.join(" ")}`);
	}

	// Helpers

	private info(msg: string) {
		this.log(chalk`[{yellow INFO}] ${msg}`);
	}

	private done(msg: string) {
		this.log(chalk`[{green DONE}] ${msg}`);
	}

	private error(msg: string, ...args: string[]) {
		this.log(chalk`[{red ERROR}] ${msg}`, ...args);
	}

	private warn(msg: string) {
		this.log(chalk`[{red WARN}] ${msg}`);
	}

	// Global

	public started() {
		this.info(chalk`{green Started}`);
	}

	public finished(started: number) {
		this.done(chalk`{green Done in ${(Date.now() - started) / 1000}s}`);
	}

	public exited() {
		this.error(chalk`{red Exited}`);
	}

	public exception() {
		this.error("An error occurred:");
	}

	public noCertbotEmail() {
		this.error(
			chalk`{red You must set the {reset {bold {dim CERBOT_EMAIL}}} environment variable, certbot can't launch without it.}`
		);
	}

	// Old configurations

	public rmOld() {
		this.info(
			chalk`{yellow Removing old generated configs...} {dim ${settings.nginxConfigPath}}`
		);
	}

	public noOld() {
		this.error(
			chalk`{red Nginx Config Path not found:} {dim ${settings.nginxConfigPath}}`
		);
		this.info(
			chalk`You can set {dim NGINX_CONFIG_PATH} env variable to customize this location.`
		);
	}

	public nginxConfNotFound(nginxPath: string) {
		this.warn(chalk`nginx.conf does not exist: {dim ${nginxPath}}`);
	}
	// Nginx Config

	public configDone(config: string) {
		this.done(config);
	}

	// User Config

	public configNotFound(path: string) {
		this.error(chalk`{red There is no config file in: } {dim ${path}}`);
	}

	public configFolderNotFound(path: string) {
		this.error(
			chalk`{red The config {bold folder} was not found} {dim ${path}}`
		);
	}

	public multipleConfigs(configs: string[]) {
		this.warn(
			chalk`Multiple config files were found, using {yellow ${configs[0]}}`
		);
	}

	public invalidConfig(multiple: boolean) {
		this.error(
			chalk`There was an issue with your config, the error${
				multiple ? "s" : ""
			} ${multiple ? "are" : "is"} listed below.`
		);
	}

	public configError(config: string) {
		this.error(
			chalk`There was an error parsing the config, please check {dim ${config}}`
		);
	}

	public configYamlError(error: YAMLException) {
		this.error(
			chalk`Yaml Error: {dim ${error.reason}}:\n${error.mark.snippet}`
		);
	}

	public configJSONError(error: Error) {
		this.error(chalk`JSON Error: {dim ${error.message}}`);
	}

	public configJSError(error: Error) {
		this.error(
			chalk`JS Error: {dim ${error.message}}\n${
				error.stack?.split("\n")[1]
			}`
		);
	}

	public configEmpty() {
		this.error(chalk`The config is empty`);
	}

	public configIssue(issue: ZodIssue) {
		const path = issue.path.join(".") || "config";
		this.log();
		this.error(chalk`{magenta Path}: {dim ${path}}`);
		this.error(chalk`{magenta Error}: ${issue.message}`);
	}

	public configValid(file: string) {
		this.info(chalk`Config is valid {dim ${file}}`);
	}

	public configENVNotFound(envKey: string, env: string) {
		this.warn(
			chalk`Config contained {dim ${envKey}}, however {dim process.env.${env}} was not defined.`
		);
	}

	// CSS

	public downloadCSS(url: string) {
		this.info(chalk`{yellow Downloading CSS file...} {dim ${url}}`);
	}

	public cachedCSS(url: string) {
		this.done(chalk`{blue CSS file is cached}, skipping: {dim ${url}}`);
	}

	public CSSDownloaded(url: string) {
		this.done(chalk`{blue Downloaded CSS file} {dim ${url}}`);
	}

	public CSSError(url: string, error: string) {
		this.error(
			chalk`{red There was an error downloading/compressing the url:} {dim ${url}}`
		);
		this.error(chalk`{red The error: } ${error}`);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public CSSWriteError(filename: string, error: any) {
		this.error(
			chalk`{red There was an error writing to} {dim ${filename}}`
		);
		this.error(chalk`{red The error: }`, error?.message ?? error);
	}

	// JS

	public downloadJS(url: string) {
		this.info(chalk`{yellow Downloading JS file...} {dim ${url}}`);
	}

	public cachedJS(url: string) {
		this.done(
			chalk`{blue JS file is already downloaded, skipping:} {dim ${url}}`
		);
	}

	public JSDownloaded(url: string) {
		this.done(chalk`{blue Downloaded JS file} {dim ${url}}`);
	}

	// Cloudflare

	private cloudflareExpiryDays = (
		settings.cloudflareExpiry /
		1000 /
		60 /
		60 /
		24
	).toFixed(0);

	public updatingCloudflare() {
		this.info(chalk`{yellow Updating Cloudflare ips...}`);
	}

	public cloudflareCached() {
		this.info(
			chalk`{blue Not updating ips}, Current config has been updated less than {dim ${this.cloudflareExpiryDays}} days`
		);
	}

	public cloudflareExpired() {
		this.info(
			chalk`Cloudflare cached ips expired, Cache duration: {dim ${this.cloudflareExpiryDays}} days`
		);
	}

	public cloudflareUpdated(took: number) {
		this.done(
			chalk`Updated Cloudflare ips {dim Request took {yellow ${took}ms}}`
		);
	}

	public cloudflareUnchanged(took: number) {
		this.info(
			chalk`Cloudflare ips refreshed, no changes with cache {dim Request took {yellow ${took}ms}}`
		);
	}

	public cloudflareRealIp() {
		this.done(chalk`Cloudflare Real Ip List has been generated`);
	}
}

export default new Log();
