import { z } from "zod";

import {
	configSchema,
	domainSchema,
	locationsSchema
} from "@lib/validateConfig";

// export type OutputLocation = z.output<typeof locationSchema>;
export type Locations = z.output<typeof locationsSchema>;
export type Server = z.output<typeof domainSchema>;
export type InputConfig = z.input<typeof configSchema>;
export type OutputConfig = z.output<typeof configSchema>;
