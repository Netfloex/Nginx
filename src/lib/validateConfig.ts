import chalk from "chalk";
import { URL } from "url";
import { z } from "zod";

import dnsLookup from "@utils/dnsLookup";
import { dontCheckDns } from "@utils/env";
import log from "@utils/log";
import { domainRegex, subdomainRegex } from "@utils/regex";

import { ValidatedConfig, ValidatedServer } from "@models/ParsedConfig";
import Config from "@models/config";

const returnKeys = ["proxy_pass", "return", "redirect", "rewrite"];

export const returnKeysFromOption = (
	options: Record<string, unknown>
): string[] => Object.keys(options).filter((key) => returnKeys.includes(key));

const urlSchema = z
	.string()
	.url()
	.refine((url) => ["http:", "https:"].includes(new URL(url).protocol), {
		message: "Invalid protocol"
	});

const authSchema = z
	.object({
		username: z.string().refine((str) => !str.includes(":")),
		password: z.string()
	})
	.strict();

const proxyPassSchema = urlSchema
	.superRefine(async (url, ctx) => {
		if (dontCheckDns) return;
		if (typeof url != "string") return;

		const { hostname } = new URL(url);
		const valid = await dnsLookup(hostname);
		if (!valid) {
			ctx.addIssue({
				message: chalk`DNS lookup failed for: {yellow ${hostname}}`,
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
			headers: {},
			auth: false
		})
	);

const urlsOrUrlSchema = urlSchema
	.array()
	.or(urlSchema)
	.default([])
	.transform((data) => [data].flat());

const oneReturnRefinement = (
	options: Record<string, unknown>,
	{ addIssue }: z.RefinementCtx
): void => {
	const keys = returnKeysFromOption(options);

	if (keys.length == 0) {
		if (!("subdomains" in options) && !("locations" in options)) {
			return addIssue({
				message: chalk`Please specify at least one "return" type: {dim ${returnKeys.join(
					", "
				)}}`,
				code: "custom"
			});
		}
	}
	if (keys.length > 1) {
		addIssue({
			message: chalk`Too many "return" types, found: {yellow ${keys.join(
				", "
			)}}, please use only one of them.`,
			code: "custom"
		});
	}
};

export const locationSchema = z
	.object({
		proxy_pass: urlSchema,
		websocket: z.boolean(),
		custom_css: urlsOrUrlSchema,
		custom_js: urlsOrUrlSchema,
		return: z.string().or(z.number()),
		headers: z.record(z.string()),
		cors: z
			.boolean()
			.transform((bool) => (bool ? "*" : false))
			.or(
				urlSchema
					.transform((url) => new URL(url).origin)
					.or(
						z.string().refine((str) => str == "*", {
							message: 'use "*" as a wildcard'
						})
					)
			),
		redirect: z.string(),
		rewrite: z.string(),
		auth: authSchema.transform((auth) => [auth]).or(authSchema.array())
	})
	.partial()
	.strict();

const locationsSchema = z.record(
	z.union([locationSchema.superRefine(oneReturnRefinement), proxyPassSchema])
);

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
			.record(
				z.union([
					subdomainSchema.superRefine(oneReturnRefinement),
					proxyPassSchema
				])
			)
			.superRefine(recordRegex(subdomainRegex, "subdomain"))
	})
	.partial();

export const configSchema = z
	.object({
		servers: z
			.record(
				z.union([
					domainSchema.superRefine(oneReturnRefinement),
					proxyPassSchema
				])
			)
			.superRefine(recordRegex(domainRegex, "domain"))
			.default({}),
		cloudflare: z.boolean().default(false)
	})
	.partial()
	.strict();

const validateConfig = async (
	config: Config
): Promise<ValidatedConfig | null> => {
	const result = await configSchema.spa(config);

	if (!result.success) {
		log.invalidConfig(result.error.issues.length > 1);
		result.error.issues.forEach((issue) => {
			if (issue.code == z.ZodIssueCode.invalid_union) {
				const errors: string[] = issue.unionErrors.flatMap((error) =>
					error.issues.map((g) => g.message)
				);

				issue.message = `${Array.from(new Set(errors)).join(
					chalk` {gray or} `
				)}`;
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
