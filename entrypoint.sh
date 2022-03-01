#!/bin/bash

start() {
    node index.js
}

reload() {
    echo Reloading...
    if start; then
        kill -1 $nginx 2>/dev/null
        wait $nginx
    fi
    
}

trap reload SIGHUP

if start; then
    /scripts/start_nginx_certbot.sh & nginx=$!
    wait $nginx
fi
