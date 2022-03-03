import { join, resolve } from "path";

const { env } = process;

const r = (env: string | undefined, or: string): string => resolve(env ?? or);

const dataPath = r(env.DATA_PATH, "data");
const nginxPath = r(env.NGINX_PATH, "nginx");
const nginxConfigPath = r(env.NGINX_CONFIG_PATH, join(nginxPath, "conf.d"));

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

	dataPath,
	customFilesPath: r(env.CUSTOM_FILES_PATH, join(dataPath, "custom")),
	authPath: r(env.AUTH_PATH, join(dataPath, "auth")),
	storePath: r(env.STORE_PATH, join(dataPath, "store.json")),

	cloudflareExpiry: +(
		(env.CLOUDFLARE_CACHE_DURATION ?? 1000 * 60 * 60 * 24 * 7) // 7 Days
	),
	dontCheckDns: !!env.DONT_CHECK_HOSTS ?? false,
	dontDownloadCustomFiles: !!env.DONT_DOWNLOAD_FILES ?? false,

	disableCertbot: env.DISABLE_CERTBOT,
	certbotMail: env.CERTBOT_EMAIL,
	staging: env.STAGING
};

export default settings;
