import fs from "fs-extra";
import { join } from "path";

type Server = {
	server: string;
	to: string;
};
const nginxConfPath = "/etc/nginx/user_conf.d";

const main = async () => {
	const servers: Server[] = await fs.readJson(
		join(__dirname, "../config/servers.json")
	);
	await fs.emptyDir(nginxConfPath);

	servers.forEach((server, i) => {
		fs.writeFile(
			join(nginxConfPath, i.toString()) + ".conf",
			`
server {
    listen 443 ssl http2;
    listen [::]:443;
    server_name ${server.server};


    location / {
        proxy_set_header Host               $host;
        proxy_set_header X-Forwarded-Scheme $scheme;
        proxy_set_header X-Forwarded-Proto  $scheme;
        proxy_set_header X-Forwarded-For    $remote_addr;
        proxy_set_header X-Real-IP          $remote_addr;
        proxy_pass       ${server.to};
    }

    ssl_certificate /etc/letsencrypt/live/${server.server}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${server.server}/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/${server.server}/chain.pem;
    ssl_dhparam /etc/letsencrypt/dhparams/dhparam.pem;


}`
		);
	});
};
main();
