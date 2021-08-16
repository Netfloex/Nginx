import { join } from "path";

const cwd = (...paths: string[]): string => join(process.cwd(), ...paths);

export const nginxConfigPath =
	process.env.NGINX_CONFIG_PATH ?? cwd("nginx_config_files");

export const dataPath = process.env.DATA_PATH ?? cwd("data");
export const customFilesPath =
	process.env.CUSTOM_FILES_PATH ?? join(dataPath, "custom");
export const storePath = process.env.STORE_PATH ?? join(dataPath, "store.json");
export const configPath = process.env.CONFIG_PATH ?? cwd("config", "config.js");

export const cloudflareExpiry: number = +(
	process.env.CLOUDFLARE_CACHE_EXPIRY ?? 1000 * 60 * 60 * 24 * 7
); // 7 Days
