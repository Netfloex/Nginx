import chalk from "chalk";

const colors: chalk.Chalk[] = [
	chalk.redBright,
	chalk.red,
	chalk.yellow,
	chalk.yellow,
	chalk.green,
	chalk.greenBright
];
/* 
	Returns a colorized number depending on its value
	Lower numbers are red,
	Medium numbers yellow,
	High values green

	if reverse is true, this list is reversed
*/
/**
 * Colorizes a number based on its value
 *
 * Red > Yellow > Green
 *
 * @param number The number to be colorized
 * @param low The lowest number possible
 * @param high The highest number possible
 * @param reverse If the colors should be in reversed order
 * @returns The colorized number
 */

export const gradientNumber = (
	number: number,
	low: number,
	high: number,
	reverse = false
): string => {
	const diffPerColor = (high - low) / colors.length;
	const colorIndex = Math.floor((number - low) / diffPerColor);

	// Clamp between the length of array

	const ci = Math.max(0, Math.min(colorIndex, colors.length - 1));
	const orderedColors = reverse ? colors.reverse() : colors;

	return orderedColors[ci](number);
};
