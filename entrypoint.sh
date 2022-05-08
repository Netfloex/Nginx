#!/bin/bash
PREFIX="[NCM] (entrypoint.sh)"

start() {
    echo "$PREFIX Generating configs"
    node index.js run
}

reload() {
    if start; then
        echo "$PREFIX Reload nginx"
        nginx -s reload && echo "$PREFIX Nginx reloaded"
        wait -n $NGINX
    fi
}

clean_exit() {
    nginx -s stop
}

if [[ ! -d "$NGINX_CONFIG_PATH" ]]; then
    echo "$PREFIX The path '$NGINX_CONFIG_PATH' does not exists"
    if [ ! -z "$STANDALONE" ];then
        echo "$PREFIX Please mount '$NGINX_PATH' inside a *volume* shared with nginx"
        echo "$PREFIX More information: https://github.com/Netfloex/Nginx#standalone"
    else
        echo "$PREFIX This should not happen in the non-standalone version"
        echo "$PREFIX This could happen because:"
        echo "		1. You deleted '$NGINX_CONFIG_PATH'"
        echo "		2. You edited the environment variable 'NGINX_CONFIG_PATH'"
        echo "		3. You mounted an empty folder at '$NGINX_PATH'"
        echo .
        echo "$PREFIX If you did not do any of the above please create an issue."
    fi
    exit
fi

cp -r nginx/builtin/* "$NGINX_CONFIG_PATH"

if [ ! -z "$STANDALONE" ];then
    echo "$PREFIX Running in standalone mode"
    mkdir -p "$NGINX_CONFIG_PATH"
    rm -f "$NGINX_CONFIG_PATH/default.conf"
    start;
    exit
fi

nginx -g "daemon off;" & NGINX=$!

trap exit TERM INT QUIT
trap clean_exit EXIT
trap reload SIGHUP

if start; then
    echo "$PREFIX Reloading Nginx"
    nginx -s reload
fi



wait $NGINX
exit $?