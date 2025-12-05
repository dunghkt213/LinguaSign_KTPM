import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      username: string;
    };
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    // Cache key: hash của token để tránh key quá dài
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const cacheKey = `jwt:${tokenHash}`;

    try {
      // 1. Check cache
      const cached = await this.cacheManager.get<any>(cacheKey);
      if (cached) {
        console.log('✅ JWT Cache HIT');
        req.user = {
          id: cached.sub,
          username: cached.username,
        };
        return true;
      }

      // 2. Cache MISS - verify token
      console.log('❌ JWT Cache MISS - verifying');
      const payload = jwt.verify(token, process.env.ACCESS_SECRET as string) as any;

      // 3. Cache với TTL = thời gian còn lại của token
      const now = Math.floor(Date.now() / 1000);
      const ttl = (payload.exp - now) * 1000; // convert sang milliseconds

      if (ttl > 0) {
        await this.cacheManager.set(cacheKey, payload, ttl);
      }

      // gắn thông tin user vào request để controller khác có thể dùng
      req.user = {
        id: payload.sub,
        username: payload.username,
      };

      return true;
    } catch (err) {
      throw new UnauthorizedException('Access token invalid or expired');
    }
  }
}
