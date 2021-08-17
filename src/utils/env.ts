import { join } from "path";

const cwd = (...paths: string[]): string => join(process.cwd(), ...paths);

const { env } = process;

export const nginxConfigPath =
	env.NGINX_CONFIG_PATH ?? cwd("nginx_config_files");

export const dataPath = env.DATA_PATH ?? cwd("data");
export const customFilesPath =
	env.CUSTOM_FILES_PATH ?? join(dataPath, "custom");
export const storePath = env.STORE_PATH ?? join(dataPath, "store.json");
export const configPath = env.CONFIG_PATH ?? cwd("config", "config.js");

export const cloudflareExpiry: number = +(
	env.CLOUDFLARE_CACHE_EXPIRY ?? 1000 * 60 * 60 * 24 * 7
); // 7 Days
export const dontCheckDns = !!env.DONT_CHECK_HOSTS ?? false;
