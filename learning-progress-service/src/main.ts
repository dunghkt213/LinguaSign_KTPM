import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // connect Kafka so service can receive progress.* messages
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'learning-progress-service',
        brokers: ['kafka:9092'],
      },
      consumer: {
        groupId: 'learning-progress-service-consumer',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
  console.log('✅ Learning Progress service running (HTTP + Kafka)');
}
bootstrap();