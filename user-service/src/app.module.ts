import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User, UserSchema } from './schemas/user.schema';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    // 1️⃣ Load biến môi trường toàn cục (.env)
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

    // 3️⃣ Sau khi có connection, mới đăng ký schema
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    
    // 4️⃣ Cache Module với Redis
    CacheModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    console.log(
      `🧠 MongoDB connection state: ${states[this.connection.readyState]}`,
    );

    this.connection.on('connected', () =>
      console.log('✅ MongoDB connected successfully'),
    );
    this.connection.on('error', (err) =>
      console.error('❌ MongoDB connection error:', err.message),
    );
  }
}
