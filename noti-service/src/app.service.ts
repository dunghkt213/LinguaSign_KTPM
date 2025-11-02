import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Noti } from './schemas/noti.schema';
import { CreateNotiDTO } from './dto/create-noti.dto';

@Injectable()
export class AppService {
  constructor(@InjectModel(Noti.name) private notiModel: Model<Noti>) {}

  async handleUserEvent(data: any) {
    console.log('Xử lý user event:', data);
    return this.sendNotification(data.userId, 'User Service Update', 'Có thay đổi từ user-service');
  }

  async handleLearningEvent(data: any) {
    console.log('Xử lý learning event:', data);
    return this.sendNotification(data.userId, 'Learning Update', 'Bạn vừa hoàn thành một bài học');
  }
  
  async sendNotification(userId: string, title: string, message: string) {
    const notification: CreateNotiDTO = { userId, title, message, read: false };
    const saved = await this.notiModel.create(notification);
    console.log('Notification saved:', saved);
    return saved;
  }
  
  async getAllNotifications(userId: string) {
    return this.notiModel.find({ userId }).exec();
  }
}
