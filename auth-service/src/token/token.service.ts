import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Token } from './token.schema';
import { Model } from 'mongoose';

@Injectable()
export class TokenService {
  constructor(
    @InjectModel(Token.name)
    private readonly tokenModel: Model<Token>,
  ) {}

  // Lưu refresh token mới vào DB
  async saveToken(userId: string, refreshToken: string, expiresAt: Date) {
    return this.tokenModel.create({
      userId,
      token: refreshToken,
      expiresAt,
      revoked: false,
    });
  }

  // Kiểm tra token này còn hợp lệ không
  async isTokenValid(refreshToken: string): Promise<boolean> {
    const doc = await this.tokenModel.findOne({ token: refreshToken }).exec();
    if (!doc) return false;
    if (doc.revoked) return false;
    if (doc.expiresAt.getTime() < Date.now()) return false;
    return true;
  }

  // Thu hồi / vô hiệu hóa (ví dụ khi logout)
  async revokeToken(refreshToken: string): Promise<void> {
    await this.tokenModel.updateOne(
      { token: refreshToken },
      { $set: { revoked: true } },
    );
  }

  // OPTIONAL: thu hồi tất cả token của user (logout all devices)
  async revokeAllForUser(userId: string) {
    await this.tokenModel.updateMany(
      { userId },
      { $set: { revoked: true } },
    );
  }
}
