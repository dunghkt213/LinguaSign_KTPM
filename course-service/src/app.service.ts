import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Model, isValidObjectId } from 'mongoose';
import { Course } from './schemas/course.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(dto: CreateCourseDto) {
    const created = new this.courseModel(dto);
    const saved = await created.save();
    
    // Invalidate courses list cache
    await this.cacheManager.del('courses:all');
    
    return saved;
  }

  async getAll(): Promise<Course[]> {
    const cacheKey = 'courses:all';
    
    // 1. Check cache
    const cached = await this.cacheManager.get<Course[]>(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return cached;
    }
    
    // 2. Cache MISS - query DB
    console.log('❌ Cache MISS:', cacheKey);
    const courses = await this.courseModel.find().exec();
    
    // 3. Save to cache (30 phút)
    await this.cacheManager.set(cacheKey, courses, 1800000);
    
    return courses;
  }

  async getById(id: string): Promise<Course> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Course not found');
    }

    const cacheKey = `course:${id}`;
    
    // 1. Check cache
    const cached = await this.cacheManager.get<Course>(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return cached;
    }
    
    // 2. Cache MISS - query DB
    console.log('❌ Cache MISS:', cacheKey);
    const course = await this.courseModel.findById(id).exec();
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    
    // 3. Save to cache (30 phút)
    await this.cacheManager.set(cacheKey, course, 1800000);
    
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
    
    // Invalidate caches
    await this.cacheManager.del(`course:${id}`);
    await this.cacheManager.del('courses:all');
    
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean; deletedId?: string }> {
    if (!isValidObjectId(id)) {
      return { deleted: false };
    }

    const deleted = await this.courseModel.findByIdAndDelete(id).exec();
    
    if (deleted) {
      // Invalidate caches
      await this.cacheManager.del(`course:${id}`);
      await this.cacheManager.del('courses:all');
    }
    
    return { deleted: !!deleted, deletedId: deleted ? String(deleted._id) : undefined };
  }
}