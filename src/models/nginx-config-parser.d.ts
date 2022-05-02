declare module "@webantic/nginx-config-parser" {
	import { Literals } from "@lib/validateConfig";

	export interface NginxConfig {
		server: Server;
	}

	interface Server {
		resolver: string;
		listen: string[];
		server_name?: string;
		[location: `location ${string}`]: NginxLocation;

		proxy_set_header: string[];
		proxy_http_version: number;

		ssl_certificate?: string;
		ssl_certificate_key?: string;
		ssl_trusted_certificate?: string;
		ssl_dhparam?: string;
	}

	export interface NginxLocation {
		set?: string[];

		proxy_set_header?: string[];
		proxy_http_version?: number;

		proxy_pass?: string;
		add_header?: string[];
		return?: string | number;
		rewrite?: string;

		root?: string;

		sub_filter?: string[];
		sub_filter_once?: string;

		auth_basic?: string;
		auth_basic_user_file?: string;

		include?: string[];
		alias?: string;
		[T: string]: Literals;
	}

	class Parser {
		public toJSON: <Config>(conf: string) => Config;
		public toConf: <Config>(json: Config) => string;
	}

	export default Parser;
}
