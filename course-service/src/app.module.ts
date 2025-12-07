import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Course, CourseSchema } from './schemas/course.schema';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: (cfg: ConfigService) => ({ 
        uri: cfg.get<string>('MONGO_URI'),
        maxPoolSize: 300,
        minPoolSize: 30,
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]),
    CacheModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}