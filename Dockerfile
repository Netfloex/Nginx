FROM node:alpine AS deps
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:alpine AS builder
WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn build && yarn install --production --ignore-scripts --prefer-offline

FROM jonasal/nginx-certbot AS runner
WORKDIR /app


RUN apt-get update
RUN apt-get install -y --no-install-recommends curl

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    nodejs


ENV NODE_ENV production

ENV FORCE_COLOR 1
ENV DATA_PATH /app/data
ENV NGINX_CONFIG_PATH /etc/nginx/user_conf.d

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/nginx ./src/nginx
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh



COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

CMD [ "/app/entrypoint.sh" ]