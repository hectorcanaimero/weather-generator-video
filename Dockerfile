# ========================
# Builder
# ========================
FROM node:20-bookworm AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ========================
# Production
# ========================
FROM node:20-bookworm-slim

# Dependencias reales para Chromium + Remotion
RUN apt-get update && apt-get install -y \
  chromium \
  ffmpeg \
  wget \
  ca-certificates \
  fonts-liberation \
  fonts-noto-color-emoji \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm install -g tsx@4.21.0

COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/remotion.config.ts ./remotion.config.ts
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/tsconfig.json ./tsconfig.json

RUN mkdir -p /app/out

EXPOSE 3001

# ========================
# VARIABLES CLAVE
# ========================
ENV NODE_ENV=production \
  PORT=3001 \
  REMOTION_DISABLE_UPDATE_CHECK=1 \
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

CMD ["tsx", "server/index.ts"]
