import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AppService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(dto: CreateUserDto): Promise<Partial<User>> {
    // ✅ 1️⃣ Hash mật khẩu trước khi lưu
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // ✅ 2️⃣ Tạo user mới
    const createdUser = new this.userModel({
      ...dto,
      password: hashedPassword,
    });

    // ✅ 3️⃣ Lưu vào MongoDB
    const savedUser = await createdUser.save();

    // ✅ 4️⃣ Ẩn password khi trả về (chỉ giữ id, name, username, email)
    const { _id, name, username, email } = savedUser.toObject();

    return { _id, name, username, email }; // 👈 Trả lại cho auth-service
  }

  async getUserByUsername(username: string): Promise<User | null> {
  return (await this.userModel
    .findOne({ username })
    .select('+password')
    .lean()
    .exec()) as User | null;
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
