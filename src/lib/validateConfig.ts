import chalk from "chalk";
import { pathExists } from "fs-extra";
import { resolve } from "path";
import { URL } from "url";
import { z } from "zod";

import { logger } from "@lib/logger";
import { dnsLookup } from "@utils/dnsLookup";
import settings from "@utils/settings";

import { InputConfig, OutputConfig } from "@models/config";

const returnKeys = [
	"proxy_pass",
	"return",
	"redirect",
	"rewrite",
	"html",
	"static",
	"raw",
	"include"
];
const optionalReturnKeys = ["raw", "include", "rewrite"];

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
	.transform((url) => (url.match(/^https?:\/\//) ? url : `http://${url}`));

const usernameAuthSchema = z.string().refine((str) => !str.includes(":"), {
	message: `Username can't contain ":"`
});

export const authSchema = z
	.string()
	.min(1)
	.transform((password) => ({ username: undefined, password }))
	.or(
		z
			.object({
				username: z.undefined().or(usernameAuthSchema),
				password: z.string().min(1)
			})
			.strict()
	)
	.or(
		z.object({
			raw: z.string().refine(
				(str) => {
					return str
						.split("\n")
						.every((string) => string.match(/:/g)?.length == 1);
				},
				{
					message: chalk`Using multiple or none "{bold :}" in raw auth`
				}
			)
		})
	);

const proxyPassSchema = urlSchema
	.refine(
		async (url) => {
			if (settings.dontCheckDns) return true;
			const host = new URL(url).hostname;
			const exists = await dnsLookup(host);

			if (exists) return exists;
			if (settings.dontExitNoUpstream) {
				logger.warnNoHost({ host });
				return true;
			}
			return exists;
		},
		(url) => ({
			message: chalk`Could not resolve {yellow ${new URL(url).hostname}}`
		})
	)
	.transform((proxy_pass) => ({
		proxy_pass,
		port: 443,
		ssl: true
	}));

const urlsOrUrlSchema = urlSchema
	.array()
	.or(urlSchema.transform((str) => [str]));

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
		.refine(
			async (path) => {
				const exists = await pathExists(path);
				if (exists) return true;

				if (settings.standalone) {
					logger.warnPathNotFound({ path });

					return true;
				}

				return false;
			},
			(path) => ({
				message: chalk`${error}: {dim ${path}}`
			})
		);

const includePathNameSchema = pathNameSchema("Include path does not exists");

export const locationSchema = z
	.object({
		proxy_pass: urlSchema,
		websocket: z.boolean(),
		custom_css: urlsOrUrlSchema,
		custom_js: urlsOrUrlSchema,
		return: z.string().or(z.number()),
		headers: z.record(literalSchema),
		cors: z.union([
			z.union([
				urlSchema.transform((url) => new URL(url).origin),
				z.string().refine((str) => str == "*", {
					message: 'use "*" as a wildcard'
				})
			]),
			z.boolean().transform((bool) => (bool ? "*" : false))
		]),
		redirect: z.string(),
		rewrite: z.string(),
		auth: authSchema.transform((auth) => [auth]).or(authSchema.array()),
		html: z.string(),
		static: pathNameSchema("Static path does not exist"),
		raw: z.record(literalOptArraySchema),
		include: includePathNameSchema
			.transform((string) => [string])
			.or(includePathNameSchema.array()),
		noindex: z.boolean()
	})
	.partial()
	.strict();

const headersTransform = (
	options: z.output<typeof locationSchema>
): z.output<typeof locationSchema> => {
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

const subdomainToHttpTransform = <T extends z.output<typeof subdomainSchema>>(
	subdomain: T
): T => {
	if (subdomain.http === true) {
		return {
			...subdomain,
			ssl: false,
			disable_cert: true,
			port: 80
		};
	}

	return subdomain;
};

const subdomainSchema = locationSchema
	.extend({
		certbot_name: z.string(),
		disable_cert: z.boolean(),
		port: z.number().int().positive().default(443),
		ssl: z.boolean().default(true),
		http: z.boolean(),
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
					.transform(subdomainToHttpTransform)
					.transform(headersTransform),
				proxyPassSchema
			])
		)
		// .superRefine(recordRegex(subdomainRegex, "subdomain"))
	})
	.partial()
	.transform(subdomainToHttpTransform);

const nginxSchema = z
	.object({
		log: z.string(),
		server_tokens: z.boolean()
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
		nginx: nginxSchema,
		username: usernameAuthSchema
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

	logger.invalidConfig({ plural: result.error.issues.length != 1 });
	result.error.issues.forEach((issue) => {
		if (issue.code == z.ZodIssueCode.invalid_union) {
			const errors: string[] = issue.unionErrors.flatMap((error) =>
				error.issues.map((g) => g.message)
			);

			issue.message = `${Array.from(new Set(errors)).join(
				chalk` {gray or} `
			)}`;
		}
		logger.configIssue({ issue });
	});

	return null;
};

export default validateConfig;
