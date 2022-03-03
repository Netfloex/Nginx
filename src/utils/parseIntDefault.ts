import chalk from "chalk";

export const parseIntDefault = (
	string: string | undefined,
	or: number
): number => {
	if (!string) return or;

	if (isNaN(parseInt(string))) {
		console.log(
			chalk`Could not parse {dim ${string}} to a number, defaulting to ${or}`
		);
		return or;
	}
	return parseInt(string);
};
