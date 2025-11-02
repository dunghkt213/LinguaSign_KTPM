import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // for unit test
  getHello(): string {
    return this.appService.getHello?.() ?? 'Hello World!';
  }

  @MessagePattern('create_course')
  createCourse(@Payload() payload: CreateCourseDto) {
    return this.appService.createCourse(payload);
  }

  @MessagePattern('get_course')
  getCourse(@Payload() payload: { id: string }) {
    return this.appService.getCourseById(payload.id);
  }

  @MessagePattern('update_course')
  updateCourse(@Payload() payload: { id: string; dto: UpdateCourseDto }) {
    return this.appService.updateCourse(payload.id, payload.dto);
  }

  @MessagePattern('delete_course')
  deleteCourse(@Payload() payload: { id: string }) {
    return this.appService.deleteCourse(payload.id);
  }

  @MessagePattern('get_all_courses')
  getAllCourses() {
    return this.appService.getAll();
  }
}