#!/bin/bash
PREFIX="[NCM] (entrypoint.sh)"

start() {
    echo "$PREFIX Generating configs..."
    node index run
}

reload_nginx() {
    echo "$PREFIX Reloading nginx..."
    nginx -s reload && echo "$PREFIX Nginx reloaded"
}

reload() {
    if start; then
        reload_nginx
    fi
}

RENEWAL_INTERVAL=8d

start_renew_loop() {
    while [ true ]; do
        echo "$PREFIX Certificate renewal will now sleep for $RENEWAL_INTERVAL... "
        sleep $RENEWAL_INTERVAL
        echo "$PREFIX Renewing certificates..."
        node index certificates
    done
}

clean_exit() {
    echo "$PREFIX Exiting..."
    nginx -s stop
    kill $LOOP_PID
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

trap exit TERM INT QUIT
trap clean_exit EXIT
trap reload SIGHUP

echo "$PREFIX Starting Nginx..."
nginx -g "daemon off;" & NGINX_PID=$!


if start; then
    reload_nginx
fi

start_renew_loop & LOOP_PID=$!


# Waiting stops whenever the HUP signal is sent
# This is why we need to wait in a loop if:
#	- It is the first iteration (EXIT_CODE is still empty)
#   - The HUP signal was sent

while [ -z "${EXIT_CODE}" ] || [ "${EXIT_CODE}" = "129" ]; do
    wait -n ${NGINX_PID} ${LOOP_PID}
    EXIT_CODE=$?
done

echo "$PREFIX Program exited"
exit $?