import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Course, CourseSchema } from './schemas/course.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: (cfg: ConfigService) =>
        ({ uri: cfg.get<string>('MONGO_URI') || 'mongodb://mongo:27017/course_db' }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}