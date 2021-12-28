import { z } from "zod";

import {
	configSchema,
	locationSchema,
	domainSchema
} from "@lib/validateConfig";

export type Locations = Record<string, z.infer<typeof locationSchema>>;
export type Server = z.infer<typeof domainSchema>;
export type InputConfig = z.input<typeof configSchema>;
export type OutputConfig = z.output<typeof configSchema>;
