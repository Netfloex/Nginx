import { z } from "zod";

import {
	configSchema,
	locationSchema,
	serverSchema
} from "@lib/validateConfig";

export type Locations = Record<string, z.infer<typeof locationSchema>>;
export type Server = z.infer<typeof serverSchema>;

type Config = z.infer<typeof configSchema>;

export default Config;
