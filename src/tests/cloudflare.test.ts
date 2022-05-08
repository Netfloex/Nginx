import { requestCloudflareIps } from "@utils/cloudflare";
import { store } from "@utils/store";

describe("Cloudflare", () => {
	test("Fetch ip list", async () => {
		store.read = jest.fn();
		store.write = jest.fn();
		store.data = { cloudflare: {} };
		const data = await requestCloudflareIps();
		if (!data) throw new Error("Cloudflare Request failed");

		expect(Array.isArray(data.ips)).toBe(true);
		expect(typeof data.type == "number").toBe(true);
		expect(data.ips.every((ip) => typeof ip == "string")).toBe(true);
	});
});
