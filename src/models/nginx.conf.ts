export type NginxConf = {
	http?: {
		log_format?: string;
		server_tokens?: "off" | "on";
	};
};
