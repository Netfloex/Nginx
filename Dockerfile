ARG NODE_IMAGE=node:16-alpine

FROM $NODE_IMAGE AS deps
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM $NODE_IMAGE AS builder
WORKDIR /app

COPY tsconfig.json package.json yarn.lock rollup.config.ts ./
COPY src ./src
COPY --from=deps /app/node_modules ./node_modules

RUN yarn build
# Disabled production dependecies, see below
# RUN yarn install --production --ignore-scripts --prefer-offline

FROM nginx:stable-alpine AS runner



WORKDIR /app

ENV NODE_ENV production
ENV FORCE_COLOR 1
ENV DATA_PATH /app/data
ENV NGINX_PATH /etc/nginx
ENV NGINX_CONFIG_PATH ${NGINX_PATH}/conf.d
ENV NGINX_BASE_CONFIGS_PATH ${NGINX_CONFIG_PATH}/base


# Dependencies

#	  Bash
RUN apk add --no-cache bash && \
	# Node
	apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/v3.16/main/ nodejs=16.16.0-r0 && \
	# Certbot
	apk add --no-cache certbot && \
	# Directory for certificates
	mkdir -p /var/www/letsencrypt


# Copy builtin configs
# These are later copied again by the entrypoint script
COPY src/nginx/builtin /app/nginx/builtin
# Delete Nginx's default config
RUN rm -f ${NGINX_CONFIG_PATH}/*
# Copy the compiled js file
COPY --from=builder /app/dist/index.js ./index.js
# Copy the script that launches nginx and the js file
COPY entrypoint.sh .

# Copy production node_modules
# Not needed anymore since there are no production modules
# COPY --from=builder /app/node_modules ./node_modules

HEALTHCHECK --interval=5s --timeout=5s --retries=3 \
	CMD wget -nv -t1 --spider 'http://localhost/healthcheck' || exit 1

CMD [ "/app/entrypoint.sh" ]