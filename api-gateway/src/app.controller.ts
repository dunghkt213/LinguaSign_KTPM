import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // ============================================================
  // 🔑 AUTH ENDPOINTS
  // ============================================================
  @Post('auth/login')
  async login(@Body() body: any) {
    return await this.appService.login(body);
  }

  @Post('auth/refresh')
  async refresh(@Body() body: any) {
    return await this.appService.refresh(body);
  }

  @Post('auth/verify')
  async verify(@Body() body: any) {
    return await this.appService.verify(body);
  }

  // ============================================================
  // 👤 USER ENDPOINTS
  // ============================================================

  @Post('users')
  async createUser(@Body() body: any) {
    console.log('📤 [Gateway] → user.create:', body);
    return await this.appService.createUser(body);
  }

  @Get('users')
  async getAllUsers() {
    console.log('📤 [Gateway] → user.getAll');
    return await this.appService.getAllUsers();
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    console.log('📤 [Gateway] → user.get:', id);
    return await this.appService.getUser({ id });
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    console.log('📤 [Gateway] → user.update:', { id, dto: body });
    return await this.appService.updateUser({ id, dto: body });
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    console.log('📤 [Gateway] → user.delete:', id);
    return await this.appService.deleteUser({ id });
  }
}
