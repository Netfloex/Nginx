import ConfigParser, { NginxConfig } from "@webantic/nginx-config-parser";
import { readFile } from "fs-extra";
import { join } from "path";

const parser = new ConfigParser();

console.log(
	parser.toJSON(`server {
    listen 443 ssl;
    server_name adguard.samtaen.nl;


    location / {
        proxy_pass http://adguard:80;
        sub_filter '</head>' '<link rel="stylesheet" type="text/css" href="/styles/adguard.css"></head>';
        sub_filter_once on;

    }
    
    location /styles {
        alias /www/files/styles;
    }
}
`)
);

const baseConf = async (): Promise<NginxConfig> => {
	const NginxConfig = (
		await readFile(join(process.cwd(), "src", "nginx", "baseConfig.conf"))
	).toString();
	return parser.toJSON(NginxConfig);
};
export default baseConf;
