export type Location = Omit<ValidatedServer, "locations"> & {
	location: string;
};

export type SimpleServer = ValidatedServer & {
	server_name: string;
	filename: string;
};

export type ValidatedServer = {
	proxy_pass?: string;
	websocket: boolean;
	custom_css: string[];
	custom_js: string[];
	return?: string;
	nossl: boolean;

	locations: Location[];
};

type ParsedConfig = {
	servers: SimpleServer[];
	cloudflare?: boolean;
};

export default ParsedConfig;
