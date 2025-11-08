import { Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
    @Inject('USER_SERVICE') private readonly userClient: ClientKafka,
    @Inject('COURSE_SERVICE') private readonly courseClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // đăng ký tất cả các topic để có thể nhận response
    this.authClient.subscribeToResponseOf('auth.register');
    this.authClient.subscribeToResponseOf('auth.login');
    this.authClient.subscribeToResponseOf('auth.refresh');
    this.authClient.subscribeToResponseOf('auth.verify');
    this.authClient.subscribeToResponseOf('auth.revoke');

    this.userClient.subscribeToResponseOf('user.create');
    this.userClient.subscribeToResponseOf('user.getAll');
    this.userClient.subscribeToResponseOf('user.get');
    this.userClient.subscribeToResponseOf('user.update');
    this.userClient.subscribeToResponseOf('user.delete');

    this.courseClient.subscribeToResponseOf('course.create');
    this.courseClient.subscribeToResponseOf('course.getAll');
    this.courseClient.subscribeToResponseOf('course.get');
    this.courseClient.subscribeToResponseOf('course.update');
    this.courseClient.subscribeToResponseOf('course.delete');
  }

  // ============================================================
  // AUTH
  // ============================================================

  async register(data: any) {
    return await this.authClient.send('auth.register', data).toPromise();
  }

  async login(data: any) {
    return await this.authClient.send('auth.login', data).toPromise();
  }

  async refresh(data: any) {
    return await this.authClient.send('auth.refresh', data).toPromise();
  }

  async verify(data: any) {
    return await this.authClient.send('auth.verify', data).toPromise();
  }

  async revoke(data: any) {
    return await this.authClient.send('auth.revoke', data).toPromise();
  }

  // ============================================================
  // USERS
  // ============================================================

  async createUser(data: any) {
    return await this.userClient.send('user.create', data).toPromise();
  }

  async getAllUsers() {
    return await this.userClient.send('user.getAll', {}).toPromise();
  }

  async getUser(data: any) {
    return await this.userClient.send('user.get', data).toPromise();
  }

  async updateUser(data: any) {
    return await this.userClient.send('user.update', data).toPromise();
  }

  async deleteUser(data: any) {
    return await this.userClient.send('user.delete', data).toPromise();
  }

  // course methods
  async createCourse(data: any) {
    return await this.courseClient.send('course.create', data).toPromise();
  }

  async getAllCourses() {
    return await this.courseClient.send('course.getAll', {}).toPromise();
  }

  async getCourse(data: any) {
    return await this.courseClient.send('course.get', data).toPromise();
  }

  async updateCourse(data: any) {
    return await this.courseClient.send('course.update', data).toPromise();
  }

  async deleteCourse(data: any) {
    return await this.courseClient.send('course.delete', data).toPromise();
  }
}
