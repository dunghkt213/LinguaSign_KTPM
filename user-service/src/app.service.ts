import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AppService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

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
    const cacheKey = `user:username:${username}`;
    
    // 1. Check cache
    const cached = await this.cacheManager.get<User>(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return cached;
    }
    
    // 2. Cache MISS - query DB
    console.log('❌ Cache MISS:', cacheKey);
    const user = (await this.userModel
      .findOne({ username })
      .select('+password')
      .lean()
      .exec()) as User | null;
    
    // 3. Save to cache (5 phút)
    if (user) {
      await this.cacheManager.set(cacheKey, user, 300000);
    }
    
    return user;
  }


  async getUserById(id: string): Promise<User | null> {
    const cacheKey = `user:${id}`;
    
    // 1. Check cache
    const cached = await this.cacheManager.get<User>(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return cached;
    }
    
    // 2. Cache MISS - query DB
    console.log('❌ Cache MISS:', cacheKey);
    const user = await this.userModel.findById(id).exec();
    
    // 3. Save to cache
    if (user) {
      await this.cacheManager.set(cacheKey, user, 300000);
    }
    
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User | null> {
    const result = await this.userModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    
    // Invalidate cache
    await this.cacheManager.del(`user:${id}`);
    if (result?.username) {
      await this.cacheManager.del(`user:username:${result.username}`);
    }
    
    return result;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.userModel.findById(id).exec();
    const result = await this.userModel.findByIdAndDelete(id).exec();
    
    // Invalidate cache
    await this.cacheManager.del(`user:${id}`);
    if (user?.username) {
      await this.cacheManager.del(`user:username:${user.username}`);
    }
    
    return result !== null;
  }

  async getAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }
}
