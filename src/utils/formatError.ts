import chalk from "chalk";

export const formatError = (error: unknown): string => {
	if (error instanceof Error) {
		return (
			chalk.dim(error.message) +
			"\n" +
			chalk.dim(error.stack?.split("\n").slice(0, 3).join("\n"))
		);
	}

	return chalk.dim(error);
};
