/* eslint-disable @typescript-eslint/explicit-function-return-type */
import chalk from "chalk";
import { ZodIssue } from "zod";

import { cloudflareExpiry, configPath, nginxConfigPath } from "@utils/env";

class Log {
	private log;

	constructor() {
		this.log = console.log;
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

	// Old configurations

	public rmOld() {
		this.info(
			chalk`{yellow Removing old generated configs...} {dim ${nginxConfigPath}}`
		);
	}

	public noOld() {
		this.error(
			chalk`{red Nginx Config Path not found:} {dim ${nginxConfigPath}}`
		);
		this.info(
			chalk`You can set the {dim NGINX_CONFIG_PATH} env variable to customize this location.`
		);
	}

	// Nginx Config

	public configDone(config: string) {
		this.done(config);
	}

	// User Config

	public configNotFound(path: string) {
		this.error(chalk`{red The config file was not found} {dim ${path}}`);
	}

	public configIssue(issue: ZodIssue) {
		this.error(
			chalk`{magenta Invalid Config} path: {dim ${
				issue.path.join(".") || "config"
			}} ${issue.message}`
		);
	}

	public configValid() {
		this.info(chalk`Config is valid {dim ${configPath}}`);
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
		cloudflareExpiry /
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
}

export default new Log();
