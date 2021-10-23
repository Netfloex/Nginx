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
	websocket?: boolean;
	custom_css?: string[];
	custom_js?: string[];
	return?: string;
	certbot_name?: string;
	headers?: Record<string, string>;
	redirect?: string;
	rewrite?: string;
	locations?: Location[];
	auth?: Auth[];
	html?: string;
};
type WithSubdomains = ValidatedServer & {
	subdomains: Record<string, ValidatedServer>;
};

type NginxConfig = {
	log?: string;
};

export type ValidatedConfig = {
	servers: Record<string, WithSubdomains>;
	cloudflare: boolean;
	nginx: NginxConfig;
};

type ParsedConfig = {
	servers: SimpleServer[];
	cloudflare: boolean;
	nginx: NginxConfig;
};

export default ParsedConfig;
