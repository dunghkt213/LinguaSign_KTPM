import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'COURSE_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: { clientId: 'api-gateway-course', brokers: ['localhost:9092'] },
          consumer: { groupId: 'api-gateway-course-consumer' },
        },
      } as any,
      {
        name: 'LEARNING_PROGRESS_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: { clientId: 'api-gateway-progress', brokers: ['localhost:9092'] },
          consumer: { groupId: 'api-gateway-progress-consumer' },
        },
      } as any,
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
