FROM node:18-alpine

# Làm việc bên trong thư mục api-gateway
WORKDIR /app

# Cài Nest CLI (nếu chưa có)
RUN npm install -g @nestjs/cli

# Copy package files và cài dependency
COPY package*.json ./
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Mặc định chạy ở chế độ dev
CMD ["npm", "run", "start:dev"]
