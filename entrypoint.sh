#!/bin/bash
PREFIX="[NCM] (entrypoint.sh)"

start() {
    echo "$PREFIX Generating configs"
    node index.js
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


if [ ! -z "$STANDALONE" ];then
    echo "$PREFIX Running in standalone mode"
    mkdir -p /etc/nginx/conf.d
    rm -f /etc/nginx/conf.d/default.conf
    cp -r nginx/builtin/* /etc/nginx/conf.d
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