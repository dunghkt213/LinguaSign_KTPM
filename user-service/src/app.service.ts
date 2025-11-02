import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AppService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    const savedUser = await createdUser.save();

    // 🔇 Tạm bỏ gửi Kafka event (chưa có noti-service)
    // this.client.emit('user.events', { userId: savedUser._id, name: savedUser.name });

    return savedUser;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, dto, { new: true }).exec();
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async getAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }
}
