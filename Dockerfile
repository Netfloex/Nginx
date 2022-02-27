ARG NODE_IMAGE=node:12-alpine

FROM $NODE_IMAGE AS deps
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM $NODE_IMAGE AS builder
WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN yarn build
RUN yarn install --production --ignore-scripts --prefer-offline

FROM jonasal/nginx-certbot:3.0.1-alpine AS runner

# Install Node
COPY --from=builder /usr/lib /usr/lib
COPY --from=builder /usr/local/share /usr/local/share
COPY --from=builder /usr/local/lib /usr/local/lib
COPY --from=builder /usr/local/include /usr/local/include
COPY --from=builder /usr/local/bin /usr/local/bin

# Remove builtin configs from parent container 
RUN rm /etc/nginx/conf.d/*

WORKDIR /app



ENV NODE_ENV production

ENV FORCE_COLOR 1
ENV DATA_PATH /app/data
ENV NGINX_PATH /etc/nginx
ENV NGINX_CONFIG_PATH /etc/nginx/user_conf.d

COPY --from=builder /app/src/nginx/builtin /etc/nginx/conf.d
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/nginx ./src/nginx
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh



COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

HEALTHCHECK --interval=5s --timeout=5s --retries=3 \
	CMD wget -nv -t1 --spider 'http://localhost/healthcheck' || exit 1

CMD [ "/app/entrypoint.sh" ]