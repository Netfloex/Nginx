import axios from "axios";
import { outputFile, pathExists } from "fs-extra";
import { performance } from "perf_hooks";

import { logger } from "@lib/logger";
import settings from "@utils/settings";
import { store } from "@utils/store";

import { IpsResponse } from "@models/cloudflare-ips";

enum Type {
	Cached = 0,
	Updated = 1,
	Unchanged = 2
}

type CloudflareData = {
	type: Type;
	ips: string[];
};

/**
 * Returns a list of cloudflare ips
 *
 * Or a cached version if it is cached less than `settings.cloudflareExpiry`
 * @returns {object} {@link CloudflareData} on success and `false` on a request error
 */

export const requestCloudflareIps = async (): Promise<
	CloudflareData | false
> => {
	await store.read();

	logger.updatingCloudflare();
	const timeAgo = Date.now() - (store.data.cloudflare.updated ?? 0);
	if (timeAgo < settings.cloudflareExpiry) {
		if (store.data.cloudflare.ips) {
			logger.cloudflareCached({
				timeAgo
			});
			return { type: Type.Cached, ips: store.data.cloudflare.ips };
		}
	} else if (store.data.cloudflare.updated) {
		logger.cloudflareExpired();
	}

	const started = performance.now();
	const res = await axios
		.get<{ result: IpsResponse }>(
			"https://api.cloudflare.com/client/v4/ips"
		)
		.catch((error) => logger.cloudflareAxiosError({ error }));
	if (!res) return false;

	const result = res.data.result;

	const etag = result.etag;
	const ips = result.ipv4_cidrs.concat(result.ipv6_cidrs);
	const changed = store.data.cloudflare.etag != etag;

	store.data.cloudflare.ips = ips;
	store.data.cloudflare.updated = Date.now();
	store.data.cloudflare.etag = etag;

	await store.write();

	if (store.data.cloudflare.ips && !changed) {
		logger.cloudflareUnchanged({ started });
		return { type: Type.Unchanged, ips };
	} else {
		logger.cloudflareUpdated({ started });
		return { type: Type.Updated, ips };
	}
};

/**
 * Creates a cloudflare.conf with the ips provided
 * Only updates the file if the ips have changed
 * Or creates it if it does not exist yet
 * @param {object} cloudflareData
 */

const updateCloudflareRealIp = async ({
	ips,
	type
}: CloudflareData): Promise<void> => {
	const configExists = await pathExists(settings.cloudflareConfPath);

	if (!configExists || type == Type.Updated) {
		const realIpList =
			ips.map((ip) => `set_real_ip_from ${ip};`).join("\n") +
			"\n\nreal_ip_header CF-Connecting-IP;";

		await outputFile(settings.cloudflareConfPath, realIpList);
		logger.cloudflareDone({ length: ips.length });
	}
};

/**
 * Make sure there is a cloudflare.conf with a recent ip list
 *
 * Runs:
 * {@link requestCloudflareIps} and {@link updateCloudflareRealIp}
 */

export const cloudflare = async (): Promise<void> => {
	const ipList = await requestCloudflareIps();
	if (ipList) await updateCloudflareRealIp(ipList);
};
