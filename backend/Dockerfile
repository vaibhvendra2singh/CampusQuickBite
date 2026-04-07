# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install native dependencies for 'canvas' and node-gyp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev

# Install all dependencies
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY . .
RUN npm run build

# Prune devDependencies to keep the final image small
RUN npm prune --production

# ── Stage 2: Production Image ──────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Install runtime libraries for 'canvas' and system fonts
RUN apk add --no-cache \
    cairo \
    pango \
    jpeg \
    giflib \
    librsvg \
    pixman \
    curl \
    ttf-dejavu \
    ttf-freefont \
    fontconfig && \
    fc-cache -f

# Copy dependencies and compiled output from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Create logs directory (winston writes here)
RUN mkdir -p logs

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001
RUN chown -R nodeapp:nodejs /app
USER nodeapp

EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://127.0.0.1:5001/health || exit 1

CMD ["node", "dist/index.js"]
