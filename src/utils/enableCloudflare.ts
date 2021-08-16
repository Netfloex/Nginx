import axios from "axios";
import { outputFile, pathExists } from "fs-extra";
import { join } from "path";

import { cloudflareExpiry, nginxConfigPath } from "@utils/env";
import log from "@utils/log";
import store from "@utils/useStore";

import { IpsResponse } from "@models/cloudflare-ips";

const requestCloudflareIps = async (): Promise<{
	etag: string;
	ips: string[];
}> => {
	const res = await axios.get("https://api.cloudflare.com/client/v4/ips");
	const result: IpsResponse = res.data.result;
	const etag = result.etag;

	const ips = result.ipv4_cidrs.concat(result.ipv6_cidrs);

	return {
		etag,
		ips
	};
};

const updateCloudflareConfig = async (): Promise<void> => {
	log.updatingCloudflare();

	const cloudflareConfPath = join(nginxConfigPath, "cloudflare.conf");
	const configExists = await pathExists(cloudflareConfPath);

	if (Date.now() - (store.data.cloudflare.updated ?? 0) < cloudflareExpiry) {
		if (configExists) {
			return log.cloudflareCached();
		}
	} else if (store.data.cloudflare.updated) {
		log.cloudflareExpired();
	}
	const started = Date.now();
	const { ips, etag } = await requestCloudflareIps();
	const took = Date.now() - started;

	store.data.cloudflare.updated = Date.now();

	if (configExists && store.data.cloudflare.etag == etag) {
		log.cloudflareUnchanged(took);
	} else {
		store.data.cloudflare.etag = etag;

		const realIpList =
			ips.map((ip) => `set_real_ip_from ${ip};`).join("\n") +
			"\n\nreal_ip_header CF-Connecting-IP;";

		await outputFile(cloudflareConfPath, realIpList);
		log.cloudflareUpdated(took);
	}

	store.write();
};

export default updateCloudflareConfig;
