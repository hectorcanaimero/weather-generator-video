# ========================
# Builder
# ========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ========================
# Production
# ========================
FROM node:20-alpine

# Dependencias del sistema para Remotion + Chromium
RUN apk add --no-cache \
    chromium \
    ffmpeg \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    dumb-init

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/remotion.config.ts ./remotion.config.ts
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/tsconfig.json ./tsconfig.json

RUN mkdir -p /app/out

EXPOSE 3001

# ========================
# 🔥 VARIABLES CLAVE (IMPORTANTES)
# ========================
ENV NODE_ENV=production \
    PORT=3001 \
    REMOTION_DISABLE_UPDATE_CHECK=1 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["dumb-init", "npx", "tsx", "server/index.ts"]
