/* eslint-disable @typescript-eslint/explicit-function-return-type */
import chalk from "chalk";
import { ZodIssue } from "zod";

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

	public rmOld(path: string) {
		this.info(
			chalk`{yellow Removing old generated configs...} {dim ${path}}`
		);
	}

	public noOld(path: string) {
		this.error(chalk`{red Nginx Config Path not found:} {dim ${path}}`);
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
		this.info(chalk`Config is valid`);
	}

	// CSS

	public downloadCSS(url: string) {
		this.info(chalk`{yellow Downloading {bold CSS} file...} {dim ${url}}`);
	}

	public cachedCSS(url: string) {
		this.done(
			chalk`{blue {bold CSS} file is already downloaded, skipping:} {dim ${url}}`
		);
	}

	public CSSDownloaded(url: string) {
		this.done(chalk`{blue Downloaded {bold CSS} file} {dim ${url}}`);
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
		this.info(chalk`{yellow Downloading {bold JS} file...} {dim ${url}}`);
	}

	public cachedJS(url: string) {
		this.done(
			chalk`{blue {bold JS} file is already downloaded, skipping:} {dim ${url}}`
		);
	}

	public JSDownloaded(url: string) {
		this.done(chalk`{blue Downloaded {bold JS} file} {dim ${url}}`);
	}

	// Cloudflare

	public updatingCloudflare() {
		this.info(chalk`{yellow Updating Cloudflare ips...}`);
	}

	public cloudflareUpdated() {
		this.done(chalk`Updated Cloudflare ips`);
	}
}

export default new Log();
