# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn (bao gồm tsconfig.json)
COPY . .

# Build TypeScript
RUN npm run build


# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app

# Copy node_modules + dist từ builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

CMD ["npm", "run", "start:dev"]
