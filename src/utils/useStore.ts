import Store from "@lib/store";
import { storePath } from "@utils/env";

type Schema = {
	cloudflare: {
		etag?: string;
		updated?: number;
		ips?: string[];
	};
};

const store = new Store<Schema>(storePath, { cloudflare: {} });

export default store;
