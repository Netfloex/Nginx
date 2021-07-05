type ProxyPass = string;

type Subdomain = Omit<Server, "subdomains">;
export type Server = {
	proxy_pass?: ProxyPass;
	subdomains?: Record<string, Subdomain | ProxyPass>;
};

type Config = {
	servers?: Record<string, Server | ProxyPass>;
};
export default Config;
