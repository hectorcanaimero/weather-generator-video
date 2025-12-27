# Multi-stage build for optimized production image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript server
RUN npm run build

# Production stage
FROM node:20-alpine

# Install system dependencies for Remotion
RUN apk add --no-cache \
    ffmpeg \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Don't skip Chromium download - let Remotion use its own browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (we need tsx and TypeScript in production)
RUN npm ci

# Force rebuild - updated 2025-12-27
RUN echo "Force rebuild to apply chromium fixes"

# Copy application files from builder
COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/remotion.config.ts ./remotion.config.ts
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create output directory for videos
RUN mkdir -p /app/out

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production \
    PORT=3001 \
    REMOTION_DISABLE_UPDATE_CHECK=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application using tsx to run TypeScript directly
CMD ["npx", "tsx", "server/index.ts"]
