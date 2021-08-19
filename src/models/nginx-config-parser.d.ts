declare module "@webantic/nginx-config-parser" {
	export interface NginxConfig {
		server: Server;
	}

	interface Server {
		listen: string[];
		server_name?: string;
		"location /": Location;
		"location /custom_assets"?: Location;
		[location: string]: Location;

		proxy_set_header: string[];
		proxy_http_version: number;

		ssl_certificate?: string;
		ssl_certificate_key?: string;
		ssl_trusted_certificate?: string;
		ssl_dhparam?: string;
	}

	interface Location {
		proxy_set_header?: string[];
		proxy_http_version?: number;

		proxy_pass?: string;
		add_header?: string[];
		return?: string;

		sub_filter?: string;
		sub_filter_once?: string;

		include?: string[];
		alias?: string;
	}
	class Parser {
		public toJSON: (conf: string) => NginxConfig;
		public toConf: (json: NginxConfig) => string;
	}
	export default Parser;
}
