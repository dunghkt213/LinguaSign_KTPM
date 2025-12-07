import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
     CacheModule,
     // Rate limiting: 100 requests per 60 seconds per IP
     ThrottlerModule.forRoot([{
       ttl: 60000, // 60 seconds
       limit: 100, // 100 requests
     }]),
     ClientsModule.register([
      {
        name: 'GATEWAY_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-gateway',
            brokers: ['kafka:9092'],
          },
          consumer: {
            groupId: 'api-gateway-consumer',
          },

          subscribe: {
            fromBeginning: false
          },
          producerOnlyMode: false,
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply rate limiting globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}