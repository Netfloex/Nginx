import Store from "@lib/store";
import settings from "@utils/settings";

type Schema = {
	cloudflare: {
		etag?: string;
		updated?: number;
		ips?: string[];
	};
};

const store = new Store<Schema>(settings.storePath, { cloudflare: {} });

export default store;
