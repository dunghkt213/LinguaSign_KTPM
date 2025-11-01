import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Token } from './token.schema';

@Injectable()
export class TokenService {
  constructor(@InjectModel(Token.name) private tokenModel: Model<Token>) {}

  async saveToken(userId: string, refreshToken: string) {
    await this.tokenModel.create({
      userId,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  async isTokenValid(refreshToken: string) {
    const token = await this.tokenModel.findOne({ refreshToken, revoked: false });
    return !!token && token.expiresAt > new Date();
  }
}
