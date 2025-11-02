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
          clientId: 'user-service',
          brokers: ['kafka:9092'], 
        },
        consumer: {
          groupId: 'user-consumer-group',
        },
      },
    },
  );

  await app.listen();
}
bootstrap();
