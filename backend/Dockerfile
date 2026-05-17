FROM node:22-alpine AS builder

WORKDIR /app

# Устойчивость к обрывам сети при npm ci в Docker
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm config set fetch-timeout 300000

COPY package.json package-lock.json ./

RUN set -e; \
  for attempt in 1 2 3 4 5; do \
    npm ci --no-audit --no-fund && exit 0; \
    echo "npm ci failed (attempt $attempt), retrying in $((attempt * 15))s..."; \
    sleep $((attempt * 15)); \
  done; \
  exit 1

COPY prisma ./prisma/
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist/
COPY prisma ./prisma/

EXPOSE 3000 8080

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
