import chalk from "chalk";
import { URL } from "url";
import { z } from "zod";

import dnsLookup from "@utils/dnsLookup";
import log from "@utils/log";
import settings from "@utils/settings";

import { ValidatedConfig } from "@models/ParsedConfig";
import { InputConfig } from "@models/config";

const returnKeys = ["proxy_pass", "return", "redirect", "rewrite", "html"];

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
		username: z
			.string()
			.refine((str) => !str.includes(":"), {
				message: `Username can't contain ":"`
			})
			.refine((str) => str.length, {
				message: "Username should not be empty"
			}),
		password: z.string().min(1)
	})
	.strict();

const proxyPassSchema = urlSchema
	.superRefine(async (url, ctx) => {
		if (settings.dontCheckDns) return;

		const { hostname } = new URL(url);
		const valid = await dnsLookup(hostname);
		if (!valid) {
			ctx.addIssue({
				message: chalk`DNS lookup failed for: {yellow ${hostname}}`,
				code: z.ZodIssueCode.custom
			});
		}
	})
	.transform((proxy_pass) => ({
		proxy_pass
	}));

const urlsOrUrlSchema = urlSchema
	.array()
	.or(urlSchema)
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
		auth: authSchema.transform((auth) => [auth]).or(authSchema.array()),
		html: z.string()
	})
	.partial()
	.strict();

const locationsSchema = z.record(
	proxyPassSchema.or(locationSchema.superRefine(oneReturnRefinement))
);

const subdomainSchema = locationSchema
	.extend({
		certbot_name: z.string(),
		locations: locationsSchema
	})
	.partial();

// const recordRegex =
// 	(regex: RegExp, type: string) =>
// 	(record: Record<string, unknown>, ctx: z.RefinementCtx): void => {
// 		Object.keys(record).forEach((key) => {
// 			if (!regex.test(key)) {
// 				ctx.addIssue({
// 					code: z.ZodIssueCode.invalid_string,
// 					message: chalk`Not a valid ${type}: {dim ${key}}`,
// 					validation: "regex"
// 				});
// 			}
// 		});
// 	};

export const domainSchema = subdomainSchema
	.extend({
		subdomains: z.record(
			z.union([
				subdomainSchema.superRefine(oneReturnRefinement),
				proxyPassSchema
			])
		)
		// .superRefine(recordRegex(subdomainRegex, "subdomain"))
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
			// .superRefine(recordRegex(domainRegex, "domain"))
			.default({}),
		cloudflare: z.boolean().default(false)
	})
	.partial()
	.strict();

const validateConfig = async (
	config: InputConfig
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
