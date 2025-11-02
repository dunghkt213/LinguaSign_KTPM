import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // ✅ Tạo microservice Kafka, KHÔNG tạo HTTP server
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'auth-service',
        brokers: ['kafka:9092'], // 👈 broker trong Docker network
      },
      consumer: {
        groupId: 'auth-consumer-group',
      },
    },
  });

  await app.listen();
  console.log('✅ Auth Service is running and connected to Kafka');
}

bootstrap();
