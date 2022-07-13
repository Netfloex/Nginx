import { OutputConfig, Server } from "@models/config";

export type SimpleServer = Server & {
	server_name: string;
	filename: string;
};

export type ParsedConfig = Omit<OutputConfig, "servers"> & {
	servers: SimpleServer[];
};
