import { Server } from "@models/config";

export type SimpleServer = Server & {
	server_name: string;
	filename: string;
};

export type Auth = {
	username: string;
	password: string;
};

type NginxConfig = {
	log?: string;
};

type ParsedConfig = {
	servers: SimpleServer[];
	cloudflare?: boolean;
	nginx?: NginxConfig;
};

export default ParsedConfig;
