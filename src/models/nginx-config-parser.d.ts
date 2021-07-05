declare module "@webantic/nginx-config-parser" {
	export interface NginxConfig {
		server: Server;
	}

	interface Server {
		listen: string[];
		server_name?: string;
		"location /": Location;

		proxy_set_header: string[];
		proxy_http_version: number;

		ssl_certificate?: string;
		ssl_certificate_key?: string;
		ssl_trusted_certificate?: string;
		ssl_dhparam: string;
	}

	interface Location {
		proxy_set_header?: string[];
		proxy_pass?: string;
	}
	class Parser {
		constructor() {}
		public toJSON: (conf: string) => NginxConfig;
		public toConf: (json: NginxConfig) => string;
	}
	export default Parser;
}
