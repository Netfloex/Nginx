import axios from "axios";
import chalk from "chalk";

import { formatError } from "@utils/formatError";

export const formatAxiosError = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		return chalk`{red Error fetching} '{dim ${error.config.url}}', ${error.message}`;
	}

	return formatError(error);
};
