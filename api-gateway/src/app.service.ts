import { Injectable, OnModuleInit, OnApplicationBootstrap, RequestTimeoutException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { timeout, catchError, throwError } from 'rxjs';

@Injectable()
export class AppService implements OnModuleInit, OnApplicationBootstrap {
  constructor(
    @Inject('GATEWAY_SERVICE') private readonly kafkaClient: ClientKafka,
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

      // Course topics
      'course.create', 'course.getAll', 'course.get',
      'course.update', 'course.delete',

      'progress.create', 'progress.get', 'progress.update', 'progress.delete',
      // Notification topics
      'noti.create', 'noti.get', 'noti.getAll',
      'noti.update', 'noti.updateReadStatus', 'noti.delete',
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
    console.log('🧭 Kafka connected?', this.kafkaClient['producer'] ? '✅ yes' : '❌ no');
    console.log('🧩 Patterns now:', this.kafkaClient['responsePatterns']);
    console.log('🧩 Sending data:', data);
    return this.kafkaClient.send('auth.register', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Auth service timeout')))
      ).toPromise();
  }

  async login(data: any) {
    return this.kafkaClient.send('auth.login', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Auth service timeout')))
      ).toPromise();
  }

  async refresh(data: any) {
    return this.kafkaClient.send('auth.refresh', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Auth service timeout')))
      ).toPromise();
  }

  async verify(data: any) {
    return this.kafkaClient.send('auth.verify', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Auth service timeout')))
      ).toPromise();
  }

  async revoke(data: any) {
    return this.kafkaClient.send('auth.revoke', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Auth service timeout')))
      ).toPromise();
  }

  // ============================================================
  // USERS
  // ============================================================

  async createUser(data: any) {
    return this.kafkaClient.send('user.create', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('User service timeout')))
      ).toPromise();
  }

  async getAllUsers(page: number = 1, limit: number = 50) {
    return this.kafkaClient.send('user.getAll', { page, limit })
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('User service timeout')))
      ).toPromise();
  }

  async getUser(data: any) {
    return this.kafkaClient.send('user.get', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('User service timeout')))
      ).toPromise();
  }

  async updateUser(data: any) {
    return this.kafkaClient.send('user.update', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('User service timeout')))
      ).toPromise();
  }

  async deleteUser(data: any) {
    return this.kafkaClient.send('user.delete', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('User service timeout')))
      ).toPromise();
  }

  // course methods
  async createCourse(data: any) {
    return this.kafkaClient.send('course.create', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Course service timeout')))
      ).toPromise();
  }

  async getAllCourses(page: number = 1, limit: number = 50) {
   return this.kafkaClient.send('course.getAll', { page, limit })
     .pipe(
       timeout(30000),
       catchError(err => throwError(() => new RequestTimeoutException('Course service timeout')))
     ).toPromise();
  }

  async getCourse(data: any) {
    return this.kafkaClient.send('course.get', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Course service timeout')))
      ).toPromise();
  }

  async updateCourse(data: any) {
    return this.kafkaClient.send('course.update', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Course service timeout')))
      ).toPromise();
  }

  async deleteCourse(data: any) {
    return this.kafkaClient.send('course.delete', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Course service timeout')))
      ).toPromise();
  }

  // progress methods
  async createProgress(data: any) {
    return this.kafkaClient.send('progress.create', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Progress service timeout')))
      ).toPromise();
  }

  async getProgress(data: any) {
    return this.kafkaClient.send('progress.get', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Progress service timeout')))
      ).toPromise();
  }

  async updateProgress(data: any) {
    return this.kafkaClient.send('progress.update', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Progress service timeout')))
      ).toPromise();
  }

  async deleteProgress(data: any) {
    return this.kafkaClient.send('progress.delete', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Progress service timeout')))
      ).toPromise();
  }

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  async createNotification(data: any) {
    return this.kafkaClient.send('noti.create', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Notification service timeout')))
      ).toPromise();
  }

  async getNotification(data: any) {
    return this.kafkaClient.send('noti.get', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Notification service timeout')))
      ).toPromise();
  }

  async getAllNotifications(data: any) {
    return this.kafkaClient.send('noti.getAll', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Notification service timeout')))
      ).toPromise();
  }

  async updateNotification(data: any) {
    return this.kafkaClient.send('noti.update', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Notification service timeout')))
      ).toPromise();
  }

  async updateReadStatus(data: any) {
    return this.kafkaClient.send('noti.updateReadStatus', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Notification service timeout')))
      ).toPromise();
  }

  async deleteNotification(data: any) {
    return this.kafkaClient.send('noti.delete', data)
      .pipe(
        timeout(30000),
        catchError(err => throwError(() => new RequestTimeoutException('Notification service timeout')))
      ).toPromise();
  }
}
