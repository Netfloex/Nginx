import axios from "axios";
import { outputFile, pathExists } from "fs-extra";

import { logger } from "@lib/logger";
import settings from "@utils/settings";
import store from "@utils/useStore";

import { IpsResponse } from "@models/cloudflare-ips";

enum Type {
	Cached = 0,
	Updated = 1,
	Unchanged = 2
}

type Data = {
	type: Type;
	ips: string[];
};

export const requestCloudflareIps = async (): Promise<Data> => {
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

	const started = Date.now();
	const res = await axios.get<{ result: IpsResponse }>(
		"https://api.cloudflare.com/client/v4/ips"
	);
	const took = Date.now() - started;

	const result = res.data.result;

	const etag = result.etag;
	const ips = result.ipv4_cidrs.concat(result.ipv6_cidrs);
	const changed = store.data.cloudflare.etag != etag;

	store.data.cloudflare.ips = ips;
	store.data.cloudflare.updated = Date.now();
	store.data.cloudflare.etag = etag;

	await store.write();

	if (store.data.cloudflare.ips && !changed) {
		logger.cloudflareUnchanged({ took });
		return { type: Type.Unchanged, ips };
	} else {
		logger.cloudflareUpdated({ took });
		return { type: Type.Updated, ips };
	}
};

export const updateCloudflareRealIp = async ({
	ips,
	type
}: Data): Promise<void> => {
	const configExists = await pathExists(settings.cloudflareConfPath);

	if (!configExists || type == Type.Updated) {
		const realIpList =
			ips.map((ip) => `set_real_ip_from ${ip};`).join("\n") +
			"\n\nreal_ip_header CF-Connecting-IP;";

		await outputFile(settings.cloudflareConfPath, realIpList);
		logger.cloudflareDone({ length: ips.length });
	}
};
