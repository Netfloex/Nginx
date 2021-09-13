export type Location = Omit<ValidatedServer, "locations"> & {
	location: string;
};

export type SimpleServer = ValidatedServer & {
	server_name: string;
	filename: string;
};

export type Auth = {
	username: string;
	password: string;
};

export type ValidatedServer = {
	proxy_pass?: string;
	websocket: boolean;
	custom_css: string[];
	custom_js: string[];
	return?: string;
	certbot_name?: string;
	headers: Record<string, string>;
	redirect?: string;
	rewrite?: string;
	locations: Location[];
	auth: Auth[] | false;
};
type WithSubdomains = ValidatedServer & {
	subdomains: Record<string, ValidatedServer>;
};

export type ValidatedConfig = {
	servers: Record<string, WithSubdomains>;
	cloudflare: boolean;
};

type ParsedConfig = {
	servers: SimpleServer[];
	cloudflare?: boolean;
};

export default ParsedConfig;
