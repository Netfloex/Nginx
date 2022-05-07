import chalk from "chalk";

export const formatError = (error: unknown): string =>
	error instanceof Error
		? chalk`{dim ${error.message}}\n{dim ${error.stack
				?.split("\n")
				.slice(0, 3)
				.join("\n")}}`
		: chalk.dim(error);
