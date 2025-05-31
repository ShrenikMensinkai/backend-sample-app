# Build stage
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:20-slim

# Install curl and netcat for health checks
RUN apt-get update && apt-get install -y curl netcat-traditional && rm -rf /var/lib/apt/lists/*

# Create app directory and set permissions
WORKDIR /usr/src/app

# Create non-root user with proper permissions
RUN groupadd -r -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs -s /bin/bash -m nestjs && \
    mkdir -p /usr/src/app && \
    chown -R nestjs:nodejs /usr/src/app

# Copy package files first
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm install prisma@latest && \
    chown -R nestjs:nodejs /usr/src/app

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/prisma ./prisma

# Copy entrypoint script
COPY --chown=nestjs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"] 