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
	nginxIncludePath: r(env.NGINX_BASE_CONFIGS_PATH, "src/nginx/builtin/base"),

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

	dontCheckDns: yn(env.DONT_CHECK_HOSTS, { default: false }),
	dontExitNoUpstream: yn(env.DONT_EXIT_NO_UPSTREAM, { default: false }),
	dnsResolver: env.DNS_RESOLVER ?? "127.0.0.11 valid=30s",
	dontDownloadCustomFiles: yn(env.DONT_DOWNLOAD_FILES, { default: false }),
	enableConfigMissingCerts: yn(env.ENABLE_CONFIG_MISSING_CERTS, {
		default: false
	}),
	watchConfigFile: yn(env.WATCH_CONFIG_FILE, { default: false }),

	dhParamSize: parseIntDefault(env.DHPARAM_SIZE, 2048),
	disableCertbot: yn(env.DISABLE_CERTBOT, { default: false }),
	certbotMail: env.CERTBOT_EMAIL,
	staging: yn(env.STAGING, { default: false }),
	useECDSA: yn(env.USE_ECDSA, { default: true }),

	logFormatColumns: yn(env.LOG_FORMAT_COLUMNS, { default: true }),
	logShowTime: yn(env.LOG_SHOW_TIME, { default: true }),
	logShowName: yn(env.LOG_SHOW_NAME, { default: true }),
	logShowTag: yn(env.LOG_SHOW_TAG, { default: true })
};

export default settings;
