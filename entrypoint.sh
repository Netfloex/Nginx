#!/bin/bash

reload() {
    node .
    kill -1 "$child" 2>/dev/null
    wait "$child"
}

trap reload SIGHUP
reload
/scripts/start_nginx_certbot.sh & child=$!
wait "$child"
