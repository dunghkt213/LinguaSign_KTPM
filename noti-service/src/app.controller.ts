import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { CreateNotiDTO } from './dto/create-noti.dto';
import { UpdateNotiDTO } from './dto/update-noti.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('noti.create')
  async createNotification(@Payload() data: CreateNotiDTO) {
    try {
      const create = await this.appService.createNotification(data);
      return { success: true, data: create}; 
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('noti.get')
  async getNotification(@Payload() data: {id : string}) {
    try {
      const noti = await this.appService.getNotification(data.id);
      if (!noti) {
        return {success: false, error: 'Notification not found'};
      }
      return { success: true, data: noti };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('noti.getAll')
  async getAllNotifications(@Payload() data: {userId: string; page?: number; limit?: number}) {
    try {
      const {userId, page = 1, limit = 10} = data;
      const result = await this.appService.getAllNotifications(userId, page, limit);
      return {success: true, data: result};
    } catch (err) {
      return {success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('noti.update')
  async updateNotification(@Payload() data: {id: string; updateData: UpdateNotiDTO}) {
    try {
      const update = await this.appService.updateNotification(data.id, data.updateData);
      if(!update ) {
        return {success: false, error: 'Notification not found'};
      }
      return {success: true, data: update};
    } catch (err) {
      return {success: false, error: err?.message ?? String(err) }; 
    }
  }

  @MessagePattern('noti.updateReadStatus')
  async updateReadStatus(@Payload() data: {id: string; read: boolean}) {
    try {
      const update = await this.appService.updateReadStatus(data.id, data.read);
      if(!update) {
        return {success: false, error: 'No notifications found for the user'};
      }
      return {success: true, data: update};
    } catch (err) {
      return {success: false, error: err?.message ?? String(err) }; 
    }
  }

  @MessagePattern('noti.delete')
  async deleteNotification(@Payload() data: {id: string}) {
    try {
      const del = await this.appService.deleteNotification(data.id);
      if(!del) {
        return {success: false, error: 'Notification not found'};
      }
      return {success: true, data: del};
    } catch (err) {
      return {success: false, error: err?.message ?? String(err) }; 
    }
  }
}

