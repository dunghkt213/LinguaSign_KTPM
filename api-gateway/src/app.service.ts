import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @Inject('AUTH_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Đăng ký topic cần lắng nghe phản hồi
    this.kafkaClient.subscribeToResponseOf('auth.login');
    this.kafkaClient.subscribeToResponseOf('auth.refresh');
    this.kafkaClient.subscribeToResponseOf('auth.verify');

    // ⚡ Bắt buộc connect()
    await this.kafkaClient.connect();
  }

  async login(payload: any) {
    console.log('🚀 Sending Kafka message to auth.login:', payload);
    return await firstValueFrom(this.kafkaClient.send('auth.login', payload));
  }

  async refresh(payload: any) {
    return await firstValueFrom(this.kafkaClient.send('auth.refresh', payload));
  }

  async verify(payload: any) {
    return await firstValueFrom(this.kafkaClient.send('auth.verify', payload));
  }
}
