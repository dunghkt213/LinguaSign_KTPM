import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'auth-service',
          brokers: ['kafka:9092'], // <-- chú ý: dùng "kafka" (service name trong docker-compose), không phải localhost
        },
        consumer: {
          groupId: 'auth-consumer-group',
        },
      },
    },
  );

  await app.listen();
}
bootstrap();
