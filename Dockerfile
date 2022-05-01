ARG NODE_IMAGE=node:12-alpine

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
RUN yarn install --production --ignore-scripts --prefer-offline

FROM nginx:stable-alpine AS runner


ENV NODE_ENV production

WORKDIR /app

ENV FORCE_COLOR 1
ENV DATA_PATH /app/data
ENV NGINX_PATH /etc/nginx
ENV NGINX_CONFIG_PATH /etc/nginx/conf.d
ENV NGINX_BASE_CONFIGS_PATH /app/nginx


# Dependencies

# - Bash
RUN apk add --no-cache bash
# - Node
RUN apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/v3.11/main/ nodejs=12.22.6-r0
# - Certbot

RUN apk add --no-cache --virtual=run-deps certbot
RUN mkdir -p /var/www/letsencrypt

# Delete unneeded files
RUN rm -rf /tmp/* \
	/var/cache/apk/*  \
	/var/tmp/




# Delete Nginx's default config
RUN rm -f /etc/nginx/conf.d/*
# Copy the compiled js file
COPY --from=builder /app/dist/index.js ./index.js
# Copy builtin configs
COPY src/nginx/builtin /etc/nginx/conf.d
# Copy the script that launches nginx and the js file
COPY entrypoint.sh .

# Copy production node_modules
COPY --from=builder /app/node_modules ./node_modules

HEALTHCHECK --interval=5s --timeout=5s --retries=3 \
	CMD wget -nv -t1 --spider 'http://localhost/healthcheck' || exit 1

CMD [ "/app/entrypoint.sh" ]