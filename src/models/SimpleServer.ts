type SimpleServer = {
	proxy_pass: string;
	server_name: string;
	filename: string;
	websocket: boolean;
	custom_css: string[];
};

export default SimpleServer;
