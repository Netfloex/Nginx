import { storePath } from "./env";

import Store from "@lib/store";

type Schema = {
	cloudflare: {
		etag?: string;
		updated?: number;
		ips?: string[];
	};
};

const store = new Store<Schema>(storePath, { cloudflare: {} });

export default store;
