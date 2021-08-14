import { z } from "zod";

import { configSchema, locationsSchema } from "@lib/validateConfig";

export type Locations = z.infer<typeof locationsSchema>;
type Config = z.infer<typeof configSchema>;

export default Config;
