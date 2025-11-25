import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Progress, ProgressSchema } from './schemas/progress.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: (cfg: ConfigService) => ({ uri: cfg.get<string>('MONGO_URI')}),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Progress.name, schema: ProgressSchema }]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
