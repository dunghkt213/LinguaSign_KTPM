import { Injectable } from '@nestjs/common';
import { Course } from './course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AppService {
  private courses: Course[] = [];

  getHello(): string {
    return 'Hello World!';
  }

  createCourse(dto: CreateCourseDto): Course {
    const c: Course = {
      id: uuidv4(),
      title: dto.title,
      summary: dto.summary,
      imageUrl: dto.imageUrl,
      createdAt: new Date().toISOString(),
    };
    this.courses.push(c);
    return c;
  }

  getCourseById(id: string): Course | undefined {
    return this.courses.find(c => c.id === id);
  }

  updateCourse(id: string, dto: UpdateCourseDto): Course | undefined {
    const idx = this.courses.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.courses[idx] = { ...this.courses[idx], ...dto };
    return this.courses[idx];
  }

  deleteCourse(id: string): boolean {
    const lenBefore = this.courses.length;
    this.courses = this.courses.filter(c => c.id !== id);
    return this.courses.length < lenBefore;
  }

  getAll(): Course[] {
    return this.courses;
  }
}