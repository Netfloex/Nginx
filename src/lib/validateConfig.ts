import { URL } from "url";
import { z } from "zod";

import log from "@utils/log";

import { ValidatedServer } from "@models/ParsedConfig";
import Config from "@models/config";

const urlSchema = z
	.string()
	.url()
	.refine((url) => ["http:", "https:"].includes(new URL(url).protocol), {
		message: "Invalid protocol"
	})
	.transform((url) => new URL(url).href);

const proxyPassSchema = urlSchema.transform(
	(proxy_pass): ValidatedServer => ({
		proxy_pass,
		websocket: false,
		custom_css: [],
		custom_js: [],
		locations: [],
		nossl: false
	})
);

const urlsOrUrlSchema = urlSchema
	.array()
	.or(urlSchema)
	.default([])
	.transform((data) => [data ?? []].flat());

export const locationSchema = z
	.object({
		proxy_pass: urlSchema,
		websocket: z.boolean(),
		custom_css: urlsOrUrlSchema,
		custom_js: urlsOrUrlSchema,
		return: z.string().or(z.number()),
		nossl: z.boolean()
	})
	.partial()
	.strict();

const locationsSchema = z.record(z.union([locationSchema, proxyPassSchema]));

const subdomainSchema = locationSchema
	.extend({
		locations: locationsSchema
	})
	.partial();

export const serverSchema = subdomainSchema
	.extend({
		subdomains: z.record(z.union([subdomainSchema, proxyPassSchema]))
	})
	.partial();

export const configSchema = z
	.object({
		servers: z.record(serverSchema),
		cloudflare: z.boolean()
	})
	.partial()
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
