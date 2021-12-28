import { Server } from "@models/config";

export type Location = Omit<Server, "locations"> & {
	location: string;
};

export type ValidatedServer = Omit<Server, "locations"> & {
	locations?: Location[];
};

export type SimpleServer = ValidatedServer & {
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
