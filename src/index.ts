import fs from "fs-extra";
import { join } from "path";
import Config from "./models/config";
import createConfig from "./utils/createConfig";

const nginxConfPath = process.env.NGINX_CONFIG_PATH ?? "/etc/nginx/user_conf.d";

const main = async () => {
	const servers: Config = await fs.readJson(
		join(__dirname, "../config/servers.json")
	);
	await fs.emptyDir(nginxConfPath);

	servers.forEach(async (server, i) => {
		const filename = join(nginxConfPath, server.server) + ".conf";
		await fs.writeFile(filename, createConfig(server));
	});
};
main();
