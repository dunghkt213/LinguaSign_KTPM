import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
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

  async getById(id: string): Promise<Course> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Course not found');
    }

    const course = await this.courseModel.findById(id).exec();
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Course not found');
    }

    const updated = await this.courseModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Course not found');
    }
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean; deletedId?: string }> {
    if (!isValidObjectId(id)) {
      return { deleted: false };
    }

    const deleted = await this.courseModel.findByIdAndDelete(id).exec();
    return { deleted: !!deleted, deletedId: deleted ? String(deleted._id) : undefined };
  }
}