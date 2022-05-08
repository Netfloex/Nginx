import axios from "axios";
import chalk from "chalk";

import { formatError } from "@utils/formatError";

/**
 * Formats an axios error
 *
 * If it is not an axios error it will format it using {@link formatError}
 * @param error An {@link Error}
 * @returns A formatted string
 */

export const formatAxiosError = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		return chalk`{red Error fetching} '{dim ${error.config.url}}', ${error.message}`;
	}

	return formatError(error);
};
