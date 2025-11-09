import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course } from './schemas/course.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class AppService {
  constructor(@InjectModel(Course.name) private courseModel: Model<Course>) {}

  async create(dto: CreateCourseDto) {
    const created = new this.courseModel(dto);
    return created.save();
  }

  async getAll() : Promise<Course[]> {
    return await this.courseModel.find().exec();
  }

  async getById(id: string) {
    const c = await this.courseModel.findById(id).exec();
    if (!c) throw new NotFoundException('Course not found');
    return c;
  }

  async update(id: string, dto: UpdateCourseDto) {
    const updated = await this.courseModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Course not found');
    return updated;
  }

  async remove(id: string) {
    const r = await this.courseModel.findByIdAndDelete(id).exec();
    return { deleted: !!r };
  }
}