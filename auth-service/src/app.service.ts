import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AppService {
  private users = [
    { id:'1', username: 'admin', password: '123', name: 'Admin User' },
  ];

  // ------------------------------
  // Xác thực user
  // ------------------------------
  validateUser(username: string, password: string) {
    const user = this.users.find(
      (u) => u.username === username && u.password === password,
    );
    return user || null;
  }

  // ------------------------------
  // Sinh Access Token
  // ------------------------------
  generateAccessToken(userId: string, username: string) {
    const secret = process.env.ACCESS_SECRET;
    if (!secret) {
      throw new Error('❌ ACCESS_SECRET not found in .env');
    }

    return jwt.sign({ sub: userId, username }, secret, {
      expiresIn: '1m',
    });
  }

  // ------------------------------
  // Sinh Refresh Token
  // ------------------------------
  generateRefreshToken(userId: string) {
    const secret = process.env.REFRESH_SECRET;
    if (!secret) {
      throw new Error('❌ REFRESH_SECRET not found in .env');
    }

    return jwt.sign({ sub: userId }, secret, {
      expiresIn: '7d',
    });
  }

  // ------------------------------
  // Verify Access Token
  // ------------------------------
  verifyAccessToken(token: string) {
    try {
      const secret = process.env.ACCESS_SECRET;
      if (!secret) throw new Error('❌ ACCESS_SECRET missing');
      return jwt.verify(token, secret as string);
    } catch (err) {
      console.error('❌ Invalid Access Token:', err.message);
      return null;
    }
  }

  // ------------------------------
  // Verify Refresh Token
  // ------------------------------
  verifyRefreshToken(token: string) {
    try {
      const secret = process.env.REFRESH_SECRET;
      if (!secret) throw new Error('❌ REFRESH_SECRET missing');
      return jwt.verify(token, secret as string);
    } catch (err) {
      console.error('❌ Invalid Refresh Token:', err.message);
      return null;
    }
  }
}
