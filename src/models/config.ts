type ProxyPass = string;

type Subdomain = Omit<Server, "subdomains">;

type Location = Omit<Subdomain, "location">;

export type Locations = Record<string, Location | ProxyPass>;

export type Server = {
	proxy_pass?: ProxyPass;
	websocket?: boolean;
	subdomains?: Record<string, Subdomain | ProxyPass>;
	custom_css?: string[] | string;
	custom_js?: string[] | string;
	locations?: Locations;
};

type Config = {
	servers?: Record<string, Server | ProxyPass>;
};
export default Config;
