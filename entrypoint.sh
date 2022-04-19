#!/bin/bash
PREFIX="[NCM] (entrypoint.sh)"

cp nginx/builtin/* /etc/nginx/conf.d

nginx -g "daemon off;" & NGINX=$!

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

trap exit TERM INT QUIT
trap clean_exit EXIT
trap reload SIGHUP

if start; then
    echo "$PREFIX Reloading Nginx"
    nginx -s reload
fi



wait $NGINX
exit $?