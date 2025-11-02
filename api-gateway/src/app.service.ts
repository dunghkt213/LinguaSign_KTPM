import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
    @Inject('USER_SERVICE') private readonly userClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // ==== AUTH topics ====
    this.authClient.subscribeToResponseOf('auth.login');
    this.authClient.subscribeToResponseOf('auth.refresh');
    this.authClient.subscribeToResponseOf('auth.verify');
    await this.authClient.connect();

    // ==== USER topics ====
    this.userClient.subscribeToResponseOf('user.create');
    this.userClient.subscribeToResponseOf('user.get');
    this.userClient.subscribeToResponseOf('user.update');
    this.userClient.subscribeToResponseOf('user.delete');
    this.userClient.subscribeToResponseOf('user.getAll');
    await this.userClient.connect();
  }

  // ============================================================
  // AUTH
  // ============================================================
  async login(body: any) {
    console.log('🚀 [Gateway] Sending → auth.login:', body);
    return await firstValueFrom(this.authClient.send('auth.login', body));
  }

  async refresh(body: any) {
    console.log('♻️ [Gateway] Sending → auth.refresh:', body);
    return await firstValueFrom(this.authClient.send('auth.refresh', body));
  }

  async verify(body: any) {
    console.log('🧾 [Gateway] Sending → auth.verify:', body);
    return await firstValueFrom(this.authClient.send('auth.verify', body));
  }

  // ============================================================
  // USER
  // ============================================================
  async createUser(body: any) {
    return await firstValueFrom(this.userClient.send('user.create', body));
  }

  async getUser(body: any) {
    return await firstValueFrom(this.userClient.send('user.get', body));
  }

  async updateUser(body: any) {
    return await firstValueFrom(this.userClient.send('user.update', body));
  }

  async deleteUser(body: any) {
    return await firstValueFrom(this.userClient.send('user.delete', body));
  }

  async getAllUsers() {
    return await firstValueFrom(this.userClient.send('user.getAll', {}));
  }
}
