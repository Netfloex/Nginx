import chalk from "chalk";

const colors: chalk.Chalk[] = [
	chalk.redBright,
	chalk.red,
	chalk.yellowBright,
	chalk.yellow,
	chalk.greenBright,
	chalk.green
];
/* 
	Returns a colorized number depending on its value
	Lower numbers are red,
	Medium numbers yellow,
	High values green

	if reverse is true, this list is reversed
*/
export const gradientNumber = (
	number: number,
	low: number,
	high: number,
	reverse = false
): string => {
	const diffPerColor = (high - low) / colors.length;
	const colorIndex = Math.floor(number / diffPerColor);

	// Clamp between the length of array

	const ci = Math.max(0, Math.min(colorIndex, colors.length - 1));

	return (reverse ? colors.reverse() : colors)[ci](number);
};
