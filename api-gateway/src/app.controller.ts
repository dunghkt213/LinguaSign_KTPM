import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('auth')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('login')
  async login(@Body() body: any) {
    return await this.appService.login(body);
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    return await this.appService.refresh(body);
  }

  @Post('verify')
  async verify(@Body() body: any) {
    return await this.appService.verify(body);
  }
}
