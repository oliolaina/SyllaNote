FROM node:22-alpine AS builder

WORKDIR /app

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

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json ./
COPY src ./src/
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
