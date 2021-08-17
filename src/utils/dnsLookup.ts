import { lookup } from "dns";

const dnsLookup = (hostname: string): Promise<boolean> =>
	new Promise((res) => lookup(hostname, {}, (err) => res(!err)));

export default dnsLookup;
