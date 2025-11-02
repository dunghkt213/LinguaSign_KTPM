# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

# copy toàn bộ mã nguồn (bao gồm tsconfig.json, nest-cli.json, src, ...)
COPY . .

RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
# nếu bạn dùng start:dev (watch), cần tsconfig.json để Nest CLI hoạt động
COPY --from=builder /app/tsconfig.json ./tsconfig.json

CMD ["npm", "run", "start:dev"]
