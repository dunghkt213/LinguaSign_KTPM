# ===========================
# Stage 1: Build
# ===========================
FROM node:20-alpine AS builder

# Set workdir inside container
WORKDIR /app

# Copy only package.json + lockfile first for faster caching
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install deps
RUN npm install

# Copy the rest of the source
COPY . .

# Build NestJS to dist/
RUN npm run build

# ===========================
# Stage 2: Runtime
# ===========================
FROM node:20-alpine AS runner

WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy built code
COPY --from=builder /app/dist ./dist

# Copy package.json in case something reads metadata
COPY --from=builder /app/package.json ./package.json

# Expose port (gateway sẽ cần HTTP, các service khác có thể không cần public)
EXPOSE 3000

# Default command
CMD ["npm", "run", "start:dev"]
