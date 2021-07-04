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

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    nodejs


ENV NODE_ENV production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/nginx ./src/nginx
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh



COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

CMD [ "/app/entrypoint.sh" ]