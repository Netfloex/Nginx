import { URL } from "url";
import { z } from "zod";

import log from "@utils/log";

import Config from "@models/config";

const urlSchema = z
	.string()
	.url()
	.refine((url) => ["http:", "https:"].includes(new URL(url).protocol), {
		message: "Invalid protocol"
	})
	.transform((url) => new URL(url).href);

const locationSchema = z
	.object({
		proxy_pass: urlSchema,
		websocket: z.boolean(),
		custom_css: z.array(urlSchema).or(urlSchema),
		custom_js: z.array(urlSchema).or(urlSchema)
	})
	.partial()
	.strict();

export const locationsSchema = z.record(z.union([locationSchema, urlSchema]));

const subdomainSchema = locationSchema
	.extend({
		locations: locationsSchema
	})
	.partial();

const serverSchema = subdomainSchema
	.extend({
		subdomains: z.record(z.union([subdomainSchema, urlSchema]))
	})
	.partial();

export const configSchema = z
	.object({
		servers: z.optional(z.record(serverSchema))
	})
	.strict();

const validateConfig = (config: Config): Config | null => {
	const result = configSchema.safeParse(config);
	if (!result.success) {
		result.error.issues.forEach((issue) => {
			if (issue.code == z.ZodIssueCode.invalid_union) {
				const expected = issue.unionErrors.flatMap((error) =>
					error.issues.map((g) =>
						"expected" in g ? g.expected : false
					)
				);

				issue.message = `Expected ${expected.join("/")}`;
			}
			log.configIssue(issue);
		});

		return null;
	} else {
		log.configValid();

		return result.data;
	}
};

export default validateConfig;
