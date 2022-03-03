import { OutputConfig, Server } from "@models/config";

export type SimpleServer = Server & {
	server_name: string;
	filename: string;
};

export type Auth = {
	username: string;
	password: string;
};

export type ParsedConfig = Omit<OutputConfig, "servers"> & {
	servers: SimpleServer[];
};
