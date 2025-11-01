import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { TokenService } from './token/token.service';

@Injectable()
export class AppService {
  constructor(private readonly tokenService: TokenService) {}

  // 🧱 Mock user (sẽ thay bằng gọi user-service thật)
  private users = [
    { id: '1', username: 'admin', password: '123', name: 'Admin User' },
    { id: '2', username: 'john', password: '456', name: 'John Doe' },
  ];

  // ============================================================
  // 🔍 Validate user (giả lập, sau này gọi user-service)
  // ============================================================
  validateUser(username: string, password: string) {
    const user = this.users.find(
      (u) => u.username === username && u.password === password,
    );
    return user || null;
  }

  // ============================================================
  // 🔑 Generate Access Token
  // ============================================================
  generateAccessToken(userId: string, username: string) {
    const secret = process.env.ACCESS_SECRET;
    if (!secret) throw new Error('❌ ACCESS_SECRET not found in .env');

    return jwt.sign({ sub: userId, username }, secret, {
      expiresIn: '5m',
    });
  }

  // ============================================================
  // 🔁 Generate Refresh Token (và lưu DB)
  // ============================================================
  async generateRefreshToken(userId: string) {
    const secret = process.env.REFRESH_SECRET;
    if (!secret) throw new Error('❌ REFRESH_SECRET not found in .env');

    const refreshToken = jwt.sign({ sub: userId }, secret, {
      expiresIn: '7d',
    });

    // 💾 Lưu refresh token vào MongoDB
    await this.tokenService.saveToken(userId, refreshToken);

    return refreshToken;
  }

  // ============================================================
  // 🔍 Verify Access Token
  // ============================================================
  verifyAccessToken(token: string) {
    try {
      const secret = process.env.ACCESS_SECRET;
      if (!secret) throw new Error('❌ ACCESS_SECRET missing');
      return jwt.verify(token, secret);
    } catch {
      return null;
    }
  }

  // ============================================================
  // 🔍 Verify Refresh Token
  // ============================================================
  async verifyRefreshToken(token: string) {
    try {
      const secret = process.env.REFRESH_SECRET;
      if (!secret) throw new Error('❌ REFRESH_SECRET missing');

      const decoded = jwt.verify(token, secret);
      const isValid = await this.tokenService.isTokenValid(token);
      if (!isValid) throw new UnauthorizedException('Refresh token revoked or expired');
      return decoded;
    } catch {
      return null;
    }
  }
}
