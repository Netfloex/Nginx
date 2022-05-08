import Store from "@lib/store";
import settings from "@utils/settings";

type Schema = {
	cloudflare: {
		etag?: string;
		updated?: number;
		ips?: string[];
	};
};

/**
 * Creates a {@link Store} to be used as a very simple JSON database
 */
export const store = new Store<Schema>(settings.storePath, { cloudflare: {} });
