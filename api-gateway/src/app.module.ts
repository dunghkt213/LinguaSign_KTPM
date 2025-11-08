import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: { clientId: 'auth-client', brokers: ['kafka:9092'] },
          consumer: { groupId: 'api-gateway-auth-consumer-client' },
        },
      },
      {
        name: 'USER_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: { clientId: 'user-client', brokers: ['kafka:9092'] },
          consumer: { groupId: 'api-gateway-user-consumer-client' },
        },
      },
      {
        name: 'COURSE_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: { clientId: 'course-client', brokers: ['kafka:9092'] },
          consumer: { groupId: 'api-gateway-course-consumer-client' },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}