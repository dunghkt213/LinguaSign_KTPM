import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE', // 👈 phải trùng với token được inject
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-gateway-auth', // Tên client Kafka
            brokers: ['kafka:9092'], // 👈 dùng 'kafka' thay vì localhost
          },
          consumer: {
            groupId: 'api-gateway-auth-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
