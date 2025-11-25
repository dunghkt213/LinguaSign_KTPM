import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Noti } from './schemas/noti.schema';
import { CreateNotiDTO } from './dto/create-noti.dto';
import { UpdateNotiDTO } from './dto/update-noti.dto';

@Injectable()
export class AppService {
  constructor(@InjectModel(Noti.name) private notiModel: Model<Noti>) {}
  
  async createNotification(createNotiDTO: CreateNotiDTO): Promise<Noti> {
    const newNoti = new this.notiModel(createNotiDTO);
    return newNoti.save();
  }

  async getNotification(id: string): Promise<Noti | null> {
    return this.notiModel.findById(id).exec();
  }

  async getAllNotifications(userId: string, page: number, limit: number)
  : Promise<{notifications: Noti[]; total: number; page: number; limit: number; totalPages: number}> {
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

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateNotification(id: string, updateNotiDTO: UpdateNotiDTO): Promise<Noti | null> {
    return this.notiModel.findByIdAndUpdate(id, updateNotiDTO, { new: true }).exec();
  }

  async updateReadStatus(id: string, read: boolean): Promise<Noti | null> {
    return this.notiModel.findByIdAndUpdate(id, { read }, { new: true }).exec();
  }

  async deleteNotification(id: string): Promise<Noti | null> {
    return this.notiModel.findByIdAndDelete(id).exec();
  }
}
