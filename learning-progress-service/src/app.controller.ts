import { Controller, Post, Body, Get, Param, Query, Put, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('progress')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() body: CreateProgressDto) {
    const created = await this.appService.create(body);
    return { success: true, data: created };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const item = await this.appService.getById(id);
    return { success: true, data: item };
  }

  // Query by userId & courseId or list by userId
  // /progress?userId=...&courseId=...
  @Get()
  async query(@Query('userId') userId?: string, @Query('courseId') courseId?: string) {
    if (userId && courseId) {
      const item = await this.appService.getByUserAndCourse(userId, courseId);
      return { success: true, data: item };
    }
    if (userId) {
      const list = await this.appService.getAllByUser(userId);
      return { success: true, data: list };
    }
    // no query params -> return ALL progress entries
    const all = await this.appService.getAll();
    return { success: true, data: all };
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(@Param('id') id: string, @Body() body: UpdateProgressDto) {
    const updated = await this.appService.update(id, body);
    return { success: true, data: updated };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const res = await this.appService.remove(id);
    return { success: true, data: res };
  }

  // Kafka handlers (so api-gateway can send messages)
  @MessagePattern('progress.create')
  async handleCreate(@Payload() data: CreateProgressDto) {
    try {
      const created = await this.appService.create(data);
      return { success: true, data: created };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('progress.get')
  async handleGet(@Payload() data: { id?: string; userId?: string; courseId?: string }) {
    try {
      if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        const all = await this.appService.getAll();
        return { success: true, data: all };
      }
      if (data.id) {
        const item = await this.appService.getById(data.id);
        return { success: true, data: item };
      }
      if (data.userId && data.courseId) {
        const item = await this.appService.getByUserAndCourse(data.userId, data.courseId);
        return { success: true, data: item };
      }
      if (data.userId) {
        const list = await this.appService.getAllByUser(data.userId);
        return { success: true, data: list };
      }
      return { success: false, error: 'Invalid query' };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('progress.update')
  async handleUpdate(@Payload() data: { id: string; dto: UpdateProgressDto }) {
    try {
      const updated = await this.appService.update(data.id, data.dto);
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('progress.delete')
  async handleDelete(@Payload() data: { id: string }) {
    try {
      const res = await this.appService.remove(data.id);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }
}
