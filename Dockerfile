
FROM node:lts-alpine3.24 AS base

FROM base AS builder
WORKDIR /ris-unit-browser

RUN apk add --no-cache git python3 make g++ \
    && corepack disable || true

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV NODE_ENV=production
RUN npm run build \
    && apk del python3 make g++ || true


FROM base AS runner

RUN apk add --no-cache ca-certificates

RUN addgroup -S risuser && adduser -S -G risuser risuser
WORKDIR /home/risuser
USER risuser

COPY --from=builder --chown=risuser:risuser /ris-unit-browser/public ./public

USER root
RUN npm install -g static-web-server --production --no-audit --no-fund \
    && npm cache clean --force \
    && chown -R risuser:risuser /usr/lib/node_modules /usr/bin
USER risuser

EXPOSE 8080
ENTRYPOINT ["static-web-server"]
CMD ["--path", "./public", "--port", "8080", "--host", "0.0.0.0"]
