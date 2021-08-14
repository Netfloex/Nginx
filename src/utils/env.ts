const env = {
	nginxConfigPath: process.env.NGINX_CONFIG_PATH ?? "/etc/nginx/user_conf.d",
	customFilesPath: process.env.CUSTOM_FILES_PATH ?? "/app/data/custom"
};

export default env;
