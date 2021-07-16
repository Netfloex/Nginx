import chalk from "chalk";

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

	public finished() {
		this.done(chalk`{green Done}`);
	}

	// Old configurations

	public rmOld(path: string) {
		this.info(
			chalk`{yellow Removing old generated configs...} {gray ${path}}`
		);
	}

	public noOld(path: string) {
		this.info(chalk`{magenta Nginx Config Path not found} {gray ${path}}`);
	}

	// Nginx Config

	public configDone(config: string) {
		this.done(config);
	}

	// User Config

	public configNotFound(path: string) {
		this.error(chalk`{red The config file was not found} {gray ${path}}`);
	}

	// CSS

	public downloadCSS(url: string) {
		this.info(chalk`{yellow Downloading {bold CSS} file...} {gray ${url}}`);
	}

	public cachedCSS(url: string) {
		this.done(
			chalk`{blue {bold CSS} file is already downloaded, skipping:} {gray ${url}}`
		);
	}

	public CSSDownloaded(url: string) {
		this.done(chalk`{blue Downloaded {bold CSS} file} {gray ${url}}`);
	}

	public CSSError(url: string, error: string) {
		this.error(
			chalk`{red There was an error downloading/compressing the url:} {gray ${url}}`
		);
		this.error(chalk`{red The error: } ${error}`);
	}

	public CSSWriteError(filename: string, error: any) {
		this.error(
			chalk`{red There was an error writing to} {gray ${filename}}`
		);
		this.error(chalk`{red The error: }`, error?.message ?? error);
	}

	// JS

	public downloadJS(url: string) {
		this.info(chalk`{yellow Downloading {bold JS} file...} {gray ${url}}`);
	}

	public cachedJS(url: string) {
		this.done(
			chalk`{blue {bold JS} file is already downloaded, skipping:} {gray ${url}}`
		);
	}

	public JSDownloaded(url: string) {
		this.done(chalk`{blue Downloaded {bold JS} file} {gray ${url}}`);
	}
}

export default new Log();
