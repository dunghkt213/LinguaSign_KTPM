import { Controller, Get, Post, Body, Param, Inject, Put, Delete } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AppService } from './app.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('COURSE_SERVICE') private readonly courseClient: ClientKafka,
    @Inject('LEARNING_PROGRESS_SERVICE') private readonly progressClient: ClientKafka,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('courses')
  async createCourse(@Body() dto: CreateCourseDto) {
    return await firstValueFrom(this.courseClient.send('create_course', dto));
  }

  @Get('courses/:id')
  async getCourse(@Param('id') id: string) {
    return await firstValueFrom(this.courseClient.send('get_course', { id }));
  }

  @Get('courses')
  async getAllCourses() {
    return await firstValueFrom(this.courseClient.send('get_all_courses', {}));
  }

  // Progress endpoints
  @Post('progress')
  async createProgress(@Body() dto: CreateProgressDto) {
    return await firstValueFrom(this.progressClient.send('create_progress', dto));
  }

  @Get('progress/user/:userId')
  async getProgressByUser(@Param('userId') userId: string) {
    return await firstValueFrom(this.progressClient.send('get_progress_by_user', { userId }));
  }

  @Get('progress/:id')
  async getProgress(@Param('id') id: string) {
    return await firstValueFrom(this.progressClient.send('get_progress', { id }));
  }

  @Put('progress/:id')
  async updateProgress(@Param('id') id: string, @Body() dto: UpdateProgressDto) {
    return await firstValueFrom(this.progressClient.send('update_progress', { id, dto }));
  }

  @Delete('progress/:id')
  async deleteProgress(@Param('id') id: string) {
    return await firstValueFrom(this.progressClient.send('delete_progress', { id }));
  }
}
