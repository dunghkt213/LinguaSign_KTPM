import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Model } from 'mongoose';
import { Noti } from './schemas/noti.schema';
import { CreateNotiDTO } from './dto/create-noti.dto';
import { UpdateNotiDTO } from './dto/update-noti.dto';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Noti.name) private notiModel: Model<Noti>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  
  async createNotification(createNotiDTO: CreateNotiDTO): Promise<Noti> {
    const newNoti = new this.notiModel(createNotiDTO);
    const saved = await newNoti.save();
    
    // Invalidate caches khi tạo notification mới
    await this.cacheManager.del(`noti:user:${createNotiDTO.userId}:unread`);
    await this.cacheManager.del(`noti:user:${createNotiDTO.userId}:page:1`);
    
    return saved;
  }

  async getNotification(id: string): Promise<Noti | null> {
    return this.notiModel.findById(id).exec();
  }

  async getAllNotifications(userId: string, page: number, limit: number)
  : Promise<{notifications: Noti[]; total: number; page: number; limit: number; totalPages: number}> {
    // Chỉ cache trang đầu tiên (page 1) vì user thường xem nhiều nhất
    if (page === 1) {
      const cacheKey = `noti:user:${userId}:page:1`;
      
      const cached = await this.cacheManager.get<any>(cacheKey);
      if (cached) {
        console.log('✅ Cache HIT:', cacheKey);
        return cached;
      }
      
      console.log('❌ Cache MISS:', cacheKey);
    }
    
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.notiModel
      .find({userId})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
      this.notiModel.countDocuments({userId}).exec(),
    ]);

    const result = {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    
    // Cache trang đầu tiên với TTL ngắn (30 giây)
    if (page === 1) {
      await this.cacheManager.set(`noti:user:${userId}:page:1`, result, 30000);
    }
    
    return result;
  }
  
  // Helper method để lấy unread count (cache riêng)
  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `noti:user:${userId}:unread`;
    
    const cached = await this.cacheManager.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) {
      console.log('✅ Unread Count Cache HIT:', cacheKey);
      return cached;
    }
    
    console.log('❌ Unread Count Cache MISS:', cacheKey);
    const count = await this.notiModel.countDocuments({ userId, read: false }).exec();
    
    // Cache 30 giây
    await this.cacheManager.set(cacheKey, count, 30000);
    
    return count;
  }

  async updateNotification(id: string, updateNotiDTO: UpdateNotiDTO): Promise<Noti | null> {
    const updated = await this.notiModel.findByIdAndUpdate(id, updateNotiDTO, { new: true }).exec();
    
    if (updated) {
      // Invalidate user's notification caches
      await this.cacheManager.del(`noti:user:${updated.userId}:unread`);
      await this.cacheManager.del(`noti:user:${updated.userId}:page:1`);
    }
    
    return updated;
  }

  async updateReadStatus(id: string, read: boolean): Promise<Noti | null> {
    const updated = await this.notiModel.findByIdAndUpdate(id, { read }, { new: true }).exec();
    
    if (updated) {
      // Invalidate unread count cache
      await this.cacheManager.del(`noti:user:${updated.userId}:unread`);
      await this.cacheManager.del(`noti:user:${updated.userId}:page:1`);
    }
    
    return updated;
  }

  async deleteNotification(id: string): Promise<Noti | null> {
    const notification = await this.notiModel.findById(id).exec();
    const deleted = await this.notiModel.findByIdAndDelete(id).exec();
    
    if (deleted && notification) {
      // Invalidate caches
      await this.cacheManager.del(`noti:user:${notification.userId}:unread`);
      await this.cacheManager.del(`noti:user:${notification.userId}:page:1`);
    }
    
    return deleted;
  }
}
