import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('user_events')
  handleUserEvents(@Payload() data: any) {
    return this.appService.handleUserEvent(data);
  }

  @MessagePattern('learning_events')
  handleLearningEvents(@Payload() data: any) {
    return this.appService.handleLearningEvent(data);
  }
}

