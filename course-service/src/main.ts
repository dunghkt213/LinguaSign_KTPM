import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Connect Kafka microservice so course-service can receive messages
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'course-service',
        brokers: ['kafka:9092'],
      },
      consumer: {
        groupId: 'course-service-consumer',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3002); // course-service HTTP port (optional)
  console.log('✅ Course service running (HTTP + Kafka)');
}
bootstrap();