import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: config.get('REDIS_HOST') || 'redis',
            port: Number(config.get('REDIS_PORT')) || 6379,
          },
        }),
        ttl: 3000, // TTL đặt ở đây (milliseconds)
      }),
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
