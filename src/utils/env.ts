import { join } from "path";

const cwd = (...paths: string[]): string => join(process.cwd(), ...paths);

const { env } = process;

export const configPath = env.CONFIG_PATH ?? cwd("config", "config.js");
export const nginxConfigPath =
	env.NGINX_CONFIG_PATH ?? cwd("nginx_config_files");
export const nginxPath =
	env.NGINX_BASE_CONFIGS_PATH ?? join(process.cwd(), "src", "nginx");

export const dataPath = env.DATA_PATH ?? cwd("data");
export const customFilesPath =
	env.CUSTOM_FILES_PATH ?? join(dataPath, "custom");
export const authPath = env.AUTH_PATH ?? join(dataPath, "auth");
export const storePath = env.STORE_PATH ?? join(dataPath, "store.json");

export const cloudflareExpiry: number = +(
	env.CLOUDFLARE_CACHE_DURATION ?? 1000 * 60 * 60 * 24 * 7
); // 7 Days
export const dontCheckDns = !!env.DONT_CHECK_HOSTS ?? false;
