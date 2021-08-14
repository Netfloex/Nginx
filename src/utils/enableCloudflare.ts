import log from "./log";
import axios from "axios";
import { outputFile } from "fs-extra";
import { join } from "path";

import env from "@utils/env";

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
	const data = await requestCloudflareIps();

	const realIpList =
		data.ips.map((ip) => `set_real_ip_from ${ip};`).join("\n") +
		"\n\nreal_ip_header CF-Connecting-IP;";
	outputFile(join(env.nginxConfigPath, "cloudflare.conf"), realIpList);
	log.cloudflareUpdated();
};

export default updateCloudflareConfig;
