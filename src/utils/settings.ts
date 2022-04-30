import { join, resolve } from "path";
import yn from "yn";

import { parseIntDefault } from "@utils/parseIntDefault";

const { env } = process;

const r = (env: string | undefined, or: string): string => resolve(env ?? or);

const dataPath = r(env.DATA_PATH, "data");
const nginxPath = r(env.NGINX_PATH, "nginx");
const nginxConfigPath = r(env.NGINX_CONFIG_PATH, join(nginxPath, "conf.d"));

const letsencryptPath = r(env.LETSENCRYPT_PATH, "/etc/letsencrypt");

const settings = {
	configPath: r(env.CONFIG_PATH, "config"),
	configFile: env.CONFIG_FILE ? resolve(env.CONFIG_FILE) : undefined,
	nginxIncludePath: r(env.NGINX_BASE_CONFIGS_PATH, "src/nginx"),

	nginxPath,

	nginxConfigPath,
	cloudflareConfPath: r(
		env.CLOUDFLARE_CONFIG_PATH,
		join(nginxConfigPath, "cloudflare.conf")
	),
	letsencryptPath,
	dhParamPath: r(
		env.DHPARAM_PATH,
		join(letsencryptPath, "dhparams", "dhparam.pem")
	),

	dataPath,
	customFilesPath: r(env.CUSTOM_FILES_PATH, join(dataPath, "custom")),
	authPath: r(env.AUTH_PATH, join(dataPath, "auth")),
	storePath: r(env.STORE_PATH, join(dataPath, "store.json")),

	cloudflareExpiry: parseIntDefault(
		env.CLOUDFLARE_CACHE_DURATION,
		1000 * 60 * 60 * 24 * 7 // 7 Days
	),

	dontCheckDns: yn(env.DONT_CHECK_HOSTS) ?? false,
	dontDownloadCustomFiles: yn(env.DONT_DOWNLOAD_FILES) ?? false,

	dhParamSize: parseIntDefault(env.DHPARAM_SIZE, 2048),
	disableCertbot: yn(env.DISABLE_CERTBOT),
	certbotMail: env.CERTBOT_EMAIL,
	staging: yn(env.STAGING),
	useECDSA: yn(env.USE_ECDSA, { default: true })
};

export default settings;
