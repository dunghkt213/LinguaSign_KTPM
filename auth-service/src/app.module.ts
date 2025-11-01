import { Module, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenModule } from './token/token.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGO_URI');
        console.log('🧩 MONGO_URI:', uri);
        return { uri };
      },
      inject: [ConfigService],
    }),

    TokenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    console.log(`🧠 MongoDB connection state: ${states[this.connection.readyState]}`);
  }
}
