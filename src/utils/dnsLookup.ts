import { lookup } from "dns";

/**
 * Performs a DNS lookup and returns a promise if the hostname is found
 * @param hostname The hostname
 * @returns {Promise<boolean>} If the domain can be found
 */

export const dnsLookup = (hostname: string): Promise<boolean> =>
	new Promise((res) => lookup(hostname, {}, (err) => res(!err)));
