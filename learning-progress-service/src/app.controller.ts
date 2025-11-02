import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  getHello(): string {
    return this.appService.getHello();
  }

  @MessagePattern('create_progress')
  createProgress(@Payload() payload: CreateProgressDto) {
    return this.appService.create(payload);
  }

  @MessagePattern('get_progress_by_user')
  getProgressByUser(@Payload() payload: { userId: string }) {
    return this.appService.getByUser(payload.userId);
  }

  @MessagePattern('get_progress')
  getProgressById(@Payload() payload: { id: string }) {
    return this.appService.getById(payload.id);
  }

  @MessagePattern('update_progress')
  updateProgress(@Payload() payload: { id: string; dto: UpdateProgressDto }) {
    return this.appService.update(payload.id, payload.dto);
  }

  @MessagePattern('delete_progress')
  deleteProgress(@Payload() payload: { id: string }) {
    return this.appService.delete(payload.id);
  }

  @MessagePattern('get_all_progresses')
  getAllProgresses() {
    return this.appService.getAll();
  }
}
