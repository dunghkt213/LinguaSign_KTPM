import { Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
    @Inject('USER_SERVICE') private readonly userClient: ClientKafka,
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
}
