import fs from "fs-extra";
import { join } from "path";
import createConfig from "./utils/createConfig";
import parseConfig from "./utils/parseConfig";

const nginxConfPath = process.env.NGINX_CONFIG_PATH ?? "/etc/nginx/user_conf.d";

const main = async () => {
	await fs.emptyDir(nginxConfPath);
	const config = await parseConfig();

	config.forEach(async (server, i) => {
		const filename =
			join(nginxConfPath, `${i}-${server.filename}`) + ".conf";
		await fs.writeFile(filename, createConfig(server));
	});
};
main();
