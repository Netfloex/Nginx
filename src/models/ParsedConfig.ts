export type Location = Omit<
	SimpleServer,
	"server_name" | "filename" | "locations"
> & {
	location: string;
};

export type SimpleServer = {
	proxy_pass?: string;
	server_name: string;
	filename: string;
	websocket: boolean;
	custom_css: string[];
	custom_js: string[];

	locations: Location[];
};

type ParsedConfig = {
	servers: SimpleServer[];
	cloudflare?: boolean;
};

export default ParsedConfig;
