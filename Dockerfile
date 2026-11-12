# syntax=docker/dockerfile:1

# ── Stage 1: install deps & build frontend ──────────────────
FROM node:24-bookworm-slim AS build
WORKDIR /app

# Build tools for native modules (better-sqlite3 fallback compile)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: production runtime ─────────────────────────────
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
# Native module already built in stage 1 — skip scripts, reuse artifact
RUN npm ci --omit=dev --ignore-scripts

COPY --from=build /app/node_modules/better-sqlite3/build ./node_modules/better-sqlite3/build
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/types ./src/types
COPY tsconfig.json ./
COPY data/*.json ./data/
COPY scripts ./scripts

# Runtime dirs (uploads are ephemeral on free hosting)
RUN mkdir -p data/uploads data/videos

EXPOSE 3001

# Seed is idempotent (INSERT OR REPLACE): re-imports base data on every boot,
# which is required because free-tier filesystems are ephemeral.
CMD ["sh", "-c", "npm run seed && npm run seed-nce && npm start"]
