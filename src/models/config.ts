type ProxyPass = string;

type Subdomain = Omit<Server, "subdomains">;
export type Server = {
	proxy_pass?: ProxyPass;
	websocket?: boolean;
	subdomains?: Record<string, Subdomain | ProxyPass>;
	custom_css?: string[] | string;
};

type Config = {
	servers?: Record<string, Server | ProxyPass>;
};
export default Config;
