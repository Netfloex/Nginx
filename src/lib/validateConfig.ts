import chalk from "chalk";
import { URL } from "url";
import { z } from "zod";

import dnsLookup from "@utils/dnsLookup";
import { dontCheckDns } from "@utils/env";
import log from "@utils/log";
import { domainRegex, subdomainRegex } from "@utils/regex";

import { ValidatedConfig, ValidatedServer } from "@models/ParsedConfig";
import Config from "@models/config";

const urlSchema = z
	.string()
	.url()
	.refine((url) => ["http:", "https:"].includes(new URL(url).protocol), {
		message: "Invalid protocol"
	})
	.transform((url) => new URL(url).href);

const proxyPassSchema = urlSchema
	.superRefine(async (url, ctx) => {
		if (dontCheckDns) return;

		const { hostname } = new URL(url);
		const valid = await dnsLookup(hostname);
		if (!valid) {
			ctx.addIssue({
				message: chalk`dns lookup failed for: {yellow ${hostname}}`,
				code: z.ZodIssueCode.custom
			});
		}
	})
	.transform(
		(
			proxy_pass
		): ValidatedServer & { subdomains: Record<string, never> } => ({
			proxy_pass,
			websocket: false,
			custom_css: [],
			custom_js: [],
			locations: [],
			subdomains: {},
			headers: {}
		})
	);

const urlsOrUrlSchema = urlSchema
	.array()
	.or(urlSchema)
	.default([])
	.transform((data) => [data].flat());

export const locationSchema = z
	.object({
		proxy_pass: urlSchema,
		websocket: z.boolean(),
		custom_css: urlsOrUrlSchema,
		custom_js: urlsOrUrlSchema,
		return: z.string().or(z.number()),
		headers: z.record(z.string()),
		redirect: z.string(),
		rewrite: z.string()
	})
	.partial()
	.strict();

const locationsSchema = z.record(z.union([locationSchema, proxyPassSchema]));

const subdomainSchema = locationSchema
	.extend({
		certbot_name: z.string().regex(domainRegex),
		locations: locationsSchema
	})
	.partial();

const recordRegex =
	(regex: RegExp, type: string) =>
	(record: Record<string, unknown>, ctx: z.RefinementCtx): void => {
		Object.keys(record).forEach((key) => {
			if (!regex.test(key)) {
				ctx.addIssue({
					code: z.ZodIssueCode.invalid_string,
					message: chalk`Not a valid ${type}: {dim ${key}}`,
					validation: "regex"
				});
			}
		});
	};

export const domainSchema = subdomainSchema
	.extend({
		subdomains: z
			.record(z.union([subdomainSchema, proxyPassSchema]))
			.superRefine(recordRegex(subdomainRegex, "subdomain"))
	})
	.partial();

export const configSchema = z
	.object({
		servers: z
			.record(z.union([domainSchema, proxyPassSchema]))
			.superRefine(recordRegex(domainRegex, "domain"))
			.default({}),
		cloudflare: z.boolean().default(false)
	})
	.partial()
	.strict();

const validateConfig = async (
	config: Config
): Promise<ValidatedConfig | null> => {
	const result = await configSchema.safeParseAsync(config);
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

		return result.data as ValidatedConfig;
	}
};

export default validateConfig;
