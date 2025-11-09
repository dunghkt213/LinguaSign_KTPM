import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Kafka message handlers (api-gateway will send these)
  @MessagePattern('course.create')
  async handleCreate(@Payload() data: any) {
    try {
      const created = await this.appService.create(data);
      return { success: true, message: 'Course created', data: created };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('course.getAll')
  async handleGetAll() {
    try {
      const all = await this.appService.getAll();
      return { success: true, data: all };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('course.get')
  async handleGet(@Payload() data: { id: string }) {
    try {
      const c = await this.appService.getById(data?.id);
      return { success: true, data: c };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('course.update')
  async handleUpdate(@Payload() data: { id: string; dto: any }) {
    try {
      const updated = await this.appService.update(data.id, data.dto);
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('course.delete')
  async handleDelete(@Payload() data: { id: string }) {
    try {
      const res = await this.appService.remove(data.id);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }
}