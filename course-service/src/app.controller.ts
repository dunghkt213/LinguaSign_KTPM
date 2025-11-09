import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}


  // Kafka message handlers (api-gateway will send these)
  @MessagePattern('course.create')
  handleCreate(@Payload() data: any) {
    try {
      const created = this.appService.create(data);
      return { success: true, message: 'Course created', data: created };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @MessagePattern('course.getAll')
  async handleGetAll() {
    return await this.appService.getAll() ;
  }

  @MessagePattern('course.get')
  handleGet(@Payload() data: { id: string }) {
    try {
      const c = this.appService.getById(data?.id);
      return { success: true, data: c };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @MessagePattern('course.update')
  handleUpdate(@Payload() data: { id: string; dto: any }) {
    try {
      const updated = this.appService.update(data.id, data.dto);
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @MessagePattern('course.delete')
  handleDelete(@Payload() data: { id: string }) {
    const res = this.appService.remove(data.id);
    return { success: true, data: res };
  }
}