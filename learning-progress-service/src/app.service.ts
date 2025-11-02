import { Injectable } from '@nestjs/common';
import { LearningProgress } from './progress.entity';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
const { v4: uuidv4 } = require('uuid');

@Injectable()
export class AppService {
  private progresses: LearningProgress[] = [];

  create(dto: CreateProgressDto): LearningProgress {
    const p: LearningProgress = {
      id: uuidv4(),
      userId: dto.userId,
      courseId: dto.courseId,
      status: dto.status ?? 'not_started',
      progressPercent: dto.progressPercent ?? 0,
      lastUpdated: new Date().toISOString(),
    };
    this.progresses.push(p);
    return p;
  }

  getById(id: string): LearningProgress | undefined {
    return this.progresses.find(x => x.id === id);
  }

  getByUser(userId: string): LearningProgress[] {
    return this.progresses.filter(x => x.userId === userId);
  }

  update(id: string, dto: UpdateProgressDto): LearningProgress | undefined {
    const idx = this.progresses.findIndex(x => x.id === id);
    if (idx === -1) return undefined;
    this.progresses[idx] = {
      ...this.progresses[idx],
      ...dto,
      lastUpdated: new Date().toISOString(),
    };
    return this.progresses[idx];
  }

  delete(id: string): boolean {
    const before = this.progresses.length;
    this.progresses = this.progresses.filter(x => x.id !== id);
    return this.progresses.length < before;
  }

  getAll(): LearningProgress[] {
    return this.progresses;
  }

  getHello(): string {
    return 'Hello World!';
  }
}
