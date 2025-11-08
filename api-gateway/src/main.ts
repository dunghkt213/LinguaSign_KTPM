import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  // 🚀 Tạo HTTP server (API Gateway)
  const app = await NestFactory.create(AppModule);

  // 🧁 Thêm middleware để đọc / ghi cookie HTTP-Only
  app.use(cookieParser());

  // 🌐 Cho phép CORS (để FE có thể gửi cookie đi)
  app.enableCors({
    origin: ['http://localhost:5173'], // 👈 domain frontend (thay bằng FE của bạn)
    credentials: true,                 // cho phép gửi cookie kèm request
  });


  await app.listen(3000);

  console.log('✅ API Gateway is running on http://localhost:3000');
}
bootstrap();
