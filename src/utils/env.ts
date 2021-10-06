import { join, resolve } from "path";

const { env } = process;

const r = (env: string | undefined, or: string): string => resolve(env ?? or);

export const configPath = r(env.CONFIG_PATH, "config/config.js");
export const nginxConfigPath = r(env.NGINX_CONFIG_PATH, "nginx_config_files");
export const nginxPath = r(env.NGINX_BASE_CONFIGS_PATH, "src/nginx");

export const dataPath = r(env.DATA_PATH, "data");
export const customFilesPath = r(
	env.CUSTOM_FILES_PATH,
	join(dataPath, "custom")
);
export const authPath = r(env.AUTH_PATH, join(dataPath, "auth"));
export const storePath = r(env.STORE_PATH, join(dataPath, "store.json"));

export const cloudflareExpiry: number = +(
	(env.CLOUDFLARE_CACHE_DURATION ?? 1000 * 60 * 60 * 24 * 7) // 7 Days
);
export const dontCheckDns = !!env.DONT_CHECK_HOSTS ?? false;
export const dontDownloadCustomFiles = !!env.DONT_DOWNLOAD_FILES ?? false;
