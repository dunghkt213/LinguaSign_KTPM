import { NestFactory } from '@nestjs/core'; 
import { AppModule } from './app.module'; 
import { MicroserviceOptions, Transport } from '@nestjs/microservices'; 

async function bootstrap() { 
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, { 
    transport: Transport.KAFKA, 
    options: { 
      client: { clientId: 'noti-service', brokers: ['localhost:9092'] }, 
      consumer: { groupId: 'noti-consumer-group' }, 
    }, 
  });  
  await app.listen();  
  console.log('✅ Noti Service connected to Kafka'); 
} 
bootstrap();
