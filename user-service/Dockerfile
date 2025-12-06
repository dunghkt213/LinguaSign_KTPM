########### BUILDER ###########
FROM node:18-alpine AS builder

WORKDIR /app

# Cài Nest CLI (dùng để "nest build")
RUN npm install -g @nestjs/cli

# Copy & cài dependencies
COPY package*.json ./
RUN npm ci

# Copy toàn bộ source code
COPY . .

# Build ra thư mục dist/
RUN npm run build


########### PRODUCTION ###########
FROM node:18-alpine AS production

WORKDIR /app

# Copy package để cài deps production
COPY package*.json ./
RUN npm ci --omit=dev

# Copy thư mục dist từ builder stage
COPY --from=builder /app/dist ./dist

# Start ứng dụng
CMD ["node", "dist/main.js"]
