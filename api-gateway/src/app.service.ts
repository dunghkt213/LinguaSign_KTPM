import { Injectable, OnModuleInit, OnApplicationBootstrap } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Injectable()
export class AppService implements OnModuleInit, OnApplicationBootstrap {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  // ============================================================
  // 1️⃣ Đăng ký tất cả topic cần phản hồi (trước khi app bootstrap)
  // ============================================================
  async onModuleInit() {
    const topics = [
      // Auth topics
      'auth.register', 'auth.login', 'auth.refresh',
      'auth.verify', 'auth.revoke',

      // User topics
      'user.create', 'user.getAll', 'user.get',
      'user.update', 'user.delete',
    ];

    topics.forEach(topic => this.kafkaClient.subscribeToResponseOf(topic));
  }

  // ============================================================
  // 2️⃣ Chỉ connect Kafka client SAU KHI toàn bộ app đã khởi động
  // ============================================================
  async onApplicationBootstrap() {
    await this.kafkaClient.connect();
    console.log('✅ Kafka client connected & response topics registered');
  }

  // ============================================================
  // AUTH
  // ============================================================

  async register(data: any) {
    return this.kafkaClient.send('auth.register', data).toPromise();
  }

  async login(data: any) {
    return this.kafkaClient.send('auth.login', data).toPromise();
  }

  async refresh(data: any) {
    return this.kafkaClient.send('auth.refresh', data).toPromise();
  }

  async verify(data: any) {
    return this.kafkaClient.send('auth.verify', data).toPromise();
  }

  async revoke(data: any) {
    return this.kafkaClient.send('auth.revoke', data).toPromise();
  }

  // ============================================================
  // USERS
  // ============================================================

  async createUser(data: any) {
    return this.kafkaClient.send('user.create', data).toPromise();
  }

  async getAllUsers() {
    return this.kafkaClient.send('user.getAll', {}).toPromise();
  }

  async getUser(data: any) {
    return this.kafkaClient.send('user.get', data).toPromise();
  }

  async updateUser(data: any) {
    return this.kafkaClient.send('user.update', data).toPromise();
  }

  async deleteUser(data: any) {
    return this.kafkaClient.send('user.delete', data).toPromise();
  }
}
