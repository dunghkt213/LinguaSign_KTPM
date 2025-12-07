import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Model, isValidObjectId } from 'mongoose';
import { Progress } from './schemas/progress.schema';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Progress.name) private progressModel: Model<Progress>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(dto: CreateProgressDto): Promise<Progress> {
    const existing = await this.progressModel.findOne({ userId: dto.userId, courseId: dto.courseId }).exec();
    let saved: Progress;
    
    if (existing) {
      existing.progress = dto.progress ?? existing.progress;
      existing.lastViewedAt = dto.lastViewedAt ? new Date(dto.lastViewedAt) : existing.lastViewedAt;
      existing.completed = dto.completed ?? existing.completed;
      saved = await existing.save();
    } else {
      const created = new this.progressModel({
        userId: dto.userId,
        courseId: dto.courseId,
        progress: dto.progress ?? 0,
        lastViewedAt: dto.lastViewedAt ? new Date(dto.lastViewedAt) : undefined,
        completed: dto.completed ?? false,
      });
      saved = await created.save();
    }
    
    // Write-Through: Update cache immediately
    await this.cacheManager.set(
      `progress:${dto.userId}:${dto.courseId}`,
      saved,
      300000
    );
    
    // Invalidate aggregate cache
    await this.cacheManager.del(`progress:user:${dto.userId}`);
    
    return saved;
  }

  async getAll(page: number = 1, limit: number = 50): Promise<{ progress: Progress[], total: number, page: number, totalPages: number }> {
    const cacheKey = `progress:all:${page}:${limit}`;
    
    // Check cache
    const cached = await this.cacheManager.get<{ progress: Progress[], total: number, page: number, totalPages: number }>(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return cached;
    }
    
    // Cache MISS - query DB
    console.log('❌ Cache MISS:', cacheKey);
    const skip = (page - 1) * limit;
    
    const [progress, total] = await Promise.all([
      this.progressModel.find().skip(skip).limit(limit).exec(),
      this.progressModel.countDocuments().exec()
    ]);
    
    const result = {
      progress,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
    
    // Save to cache (30 minutes)
    await this.cacheManager.set(cacheKey, result, 1800000);
    
    return result;
  }

  async getById(id: string): Promise<Progress> {
    if (!isValidObjectId(id)) throw new NotFoundException('Progress not found');
    const item = await this.progressModel.findById(id).exec();
    if (!item) throw new NotFoundException('Progress not found');
    return item;
  }

  async getByUserAndCourse(userId: string, courseId: string): Promise<Progress | null> {
    const cacheKey = `progress:${userId}:${courseId}`;
    
    // 1. Check cache
    const cached = await this.cacheManager.get<Progress>(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return cached;
    }
    
    // 2. Cache MISS - query DB
    console.log('❌ Cache MISS:', cacheKey);
    const progress = await this.progressModel.findOne({ userId, courseId }).exec();
    
    // 3. Save to cache
    if (progress) {
      await this.cacheManager.set(cacheKey, progress, 300000);
    }
    
    return progress;
  }

  async getAllByUser(userId: string, page: number = 1, limit: number = 50): Promise<{ progress: Progress[], total: number, page: number, totalPages: number }> {
    const cacheKey = `progress:user:${userId}:${page}:${limit}`;
    
    // Check cache
    const cached = await this.cacheManager.get<{ progress: Progress[], total: number, page: number, totalPages: number }>(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return cached;
    }
    
    // Cache MISS - query DB
    console.log('❌ Cache MISS:', cacheKey);
    const skip = (page - 1) * limit;
    
    const [progress, total] = await Promise.all([
      this.progressModel.find({ userId }).skip(skip).limit(limit).exec(),
      this.progressModel.countDocuments({ userId }).exec()
    ]);
    
    const result = {
      progress,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
    
    // Save to cache (5 minutes)
    await this.cacheManager.set(cacheKey, result, 300000);
    
    return result;
  }

  async update(id: string, dto: UpdateProgressDto): Promise<Progress> {
    if (!isValidObjectId(id)) throw new NotFoundException('Progress not found');
    const updatePayload: any = {};
    if (dto.progress !== undefined) updatePayload.progress = dto.progress;
    if (dto.lastViewedAt !== undefined) updatePayload.lastViewedAt = new Date(dto.lastViewedAt);
    if (dto.completed !== undefined) updatePayload.completed = dto.completed;

    const updated = await this.progressModel.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true }).exec();
    if (!updated) throw new NotFoundException('Progress not found');
    
    // Invalidate related caches
    await this.cacheManager.del(`progress:${updated.userId}:${updated.courseId}`);
    await this.cacheManager.del(`progress:user:${updated.userId}`);
    
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    if (!isValidObjectId(id)) return { deleted: false };
    
    const progress = await this.progressModel.findById(id).exec();
    const r = await this.progressModel.findByIdAndDelete(id).exec();
    
    if (r && progress) {
      // Invalidate caches
      await this.cacheManager.del(`progress:${progress.userId}:${progress.courseId}`);
      await this.cacheManager.del(`progress:user:${progress.userId}`);
    }
    
    return { deleted: !!r };
  }
}
