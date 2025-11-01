import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: { clientId: 'auth-service', brokers: ['localhost:9092'] },
      consumer: { groupId: 'auth-consumer-group' },
    },
  });

  await app.listen();
  console.log('✅ Auth Service connected to Kafka');
}
bootstrap();
