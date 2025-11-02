import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // 🚀 Tạo HTTP server để nhận request từ Postman
  const app = await NestFactory.create(AppModule);

  // 🔗 Kết nối thêm microservice Kafka (vừa HTTP, vừa Kafka)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'api-gateway',
        brokers: ['kafka:9092'], 
      },
      consumer: {
        groupId: 'api-gateway-consumer',
      },
    },
  });

  // 🚀 Start cả 2 song song
  await app.startAllMicroservices();
  await app.listen(3000);

  console.log('✅ API Gateway is running on http://localhost:3000');
}
bootstrap();
