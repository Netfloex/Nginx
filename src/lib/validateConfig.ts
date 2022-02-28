import chalk from "chalk";
import { pathExists } from "fs-extra";
import { resolve } from "path";
import { URL } from "url";
import { z, ZodIssueCode } from "zod";

import dnsLookup from "@utils/dnsLookup";
import log from "@utils/log";
import settings from "@utils/settings";

import { InputConfig, OutputConfig } from "@models/config";

const returnKeys = [
	"proxy_pass",
	"return",
	"redirect",
	"rewrite",
	"html",
	"static",
	"raw"
];
const optionalReturnKeys = ["raw"];

const literalSchema = z.union([z.string(), z.number(), z.boolean()]);
const literalOptArraySchema = z.union([
	literalSchema.transform((data) => [data]),
	literalSchema.array()
]);
export type Literals = z.output<typeof literalOptArraySchema>;

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

const oneReturnRefinement =
	(allowNone = false) =>
	(options: Record<string, unknown>, { addIssue }: z.RefinementCtx): void => {
		const keys = returnKeysFromOption(options);

		if (!allowNone && keys.length == 0) {
			if (!("subdomains" in options) && !("locations" in options)) {
				return addIssue({
					message: chalk`Please specify at least one "return" type: {dim ${returnKeys.join(
						", "
					)}}`,
					code: "custom"
				});
			}
		}

		if (
			keys.filter((key) => !optionalReturnKeys.includes(key)).length > 1
		) {
			addIssue({
				message: chalk`Too many "return" types, found: {yellow ${keys.join(
					", "
				)}}, please use only one of them.`,
				code: "custom"
			});
		}
	};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const pathNameSchema = (error: string) =>
	z
		.string()
		.transform((str) => resolve(str))
		.superRefine(async (path, ctx) => {
			if (!(await pathExists(path))) {
				ctx.addIssue({
					code: ZodIssueCode.custom,
					message: chalk`${error}: {dim ${path}}`
				});
			}
		});

const includePathNameSchema = pathNameSchema("Include path does not exists");

export const locationSchema = z
	.object({
		proxy_pass: urlSchema,
		websocket: z.boolean(),
		custom_css: urlsOrUrlSchema,
		custom_js: urlsOrUrlSchema,
		return: z.string().or(z.number()),
		headers: z.record(literalSchema),
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
		html: z.string(),
		static: pathNameSchema("Static path does not exist"),
		raw: z.record(literalOptArraySchema),
		include: includePathNameSchema
			.transform((string) => [string])
			.or(includePathNameSchema.array())
	})
	.partial()
	.strict();

const headersTransform = (
	options: z.infer<typeof locationSchema>
): z.infer<typeof locationSchema> => {
	const headers = {
		...options.headers,
		...("cors" in options &&
			options.cors && {
				"Access-Control-Allow-Origin": options.cors
			})
	};

	delete options.cors;

	return {
		...options,
		...(Object.keys(headers).length && { headers })
	};
};

export const locationsSchema = z
	.record(
		proxyPassSchema.or(
			locationSchema
				.superRefine(oneReturnRefinement(true))
				.transform(headersTransform)
		)
	)

	.transform((locations) =>
		Object.entries(locations ?? {}).map(([path, location]) => ({
			...location,
			location: path
		}))
	);

const subdomainSchema = locationSchema
	.extend({
		certbot_name: z.string(),
		disable_cert: z.boolean(),
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
				subdomainSchema
					.superRefine(oneReturnRefinement())
					.transform(headersTransform),
				proxyPassSchema
			])
		)
		// .superRefine(recordRegex(subdomainRegex, "subdomain"))
	})
	.partial();

const nginxSchema = z
	.object({
		log: z.string()
	})
	.partial()
	.strict();

export const configSchema = z
	.object({
		servers: z.record(
			z.union([
				domainSchema
					.superRefine(oneReturnRefinement())
					.transform(headersTransform),
				proxyPassSchema
			])
		),
		// .superRefine(recordRegex(domainRegex, "domain"))

		cloudflare: z.boolean(),
		nginx: nginxSchema
	})
	.partial()
	.strict();

const validateConfig = async (
	config: InputConfig | unknown
): Promise<OutputConfig | null> => {
	const result = await configSchema.spa(config);

	if (result.success) {
		return result.data;
	}

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
};

export default validateConfig;
