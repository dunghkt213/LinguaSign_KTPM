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
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGO_URI');
        console.log('🧩 MONGO_URI:', uri);
        return {
        uri,
        maxPoolSize: 500,       // 👈 thêm vào đây
        minPoolSize: 50,        // 👈 để tránh khởi động quá chậm
        maxIdleTimeMS: 20000,   // 👈 tránh giữ kết nối chết
        serverSelectionTimeoutMS: 5000, // 👈 fail nhanh khi Mongo overload
      };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]),
    CacheModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}