import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Progress } from './schemas/progress.schema';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class AppService {
  constructor(@InjectModel(Progress.name) private progressModel: Model<Progress>) {}

  async create(dto: CreateProgressDto): Promise<Progress> {
    const existing = await this.progressModel.findOne({ userId: dto.userId, courseId: dto.courseId }).exec();
    if (existing) {
      existing.progress = dto.progress ?? existing.progress;
      existing.lastViewedAt = dto.lastViewedAt ? new Date(dto.lastViewedAt) : existing.lastViewedAt;
      existing.completed = dto.completed ?? existing.completed;
      return existing.save();
    }
    const created = new this.progressModel({
      userId: dto.userId,
      courseId: dto.courseId,
      progress: dto.progress ?? 0,
      lastViewedAt: dto.lastViewedAt ? new Date(dto.lastViewedAt) : undefined,
      completed: dto.completed ?? false,
    });
    return created.save();
  }

  async getAll(): Promise<Progress[]> {
    return this.progressModel.find().exec();
  }

  async getById(id: string): Promise<Progress> {
    if (!isValidObjectId(id)) throw new NotFoundException('Progress not found');
    const item = await this.progressModel.findById(id).exec();
    if (!item) throw new NotFoundException('Progress not found');
    return item;
  }

  async getByUserAndCourse(userId: string, courseId: string): Promise<Progress | null> {
    return this.progressModel.findOne({ userId, courseId }).exec();
  }

  async getAllByUser(userId: string): Promise<Progress[]> {
    return this.progressModel.find({ userId }).exec();
  }

  async update(id: string, dto: UpdateProgressDto): Promise<Progress> {
    if (!isValidObjectId(id)) throw new NotFoundException('Progress not found');
    const updatePayload: any = {};
    if (dto.progress !== undefined) updatePayload.progress = dto.progress;
    if (dto.lastViewedAt !== undefined) updatePayload.lastViewedAt = new Date(dto.lastViewedAt);
    if (dto.completed !== undefined) updatePayload.completed = dto.completed;

    const updated = await this.progressModel.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true }).exec();
    if (!updated) throw new NotFoundException('Progress not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    if (!isValidObjectId(id)) return { deleted: false };
    const r = await this.progressModel.findByIdAndDelete(id).exec();
    return { deleted: !!r };
  }
}
