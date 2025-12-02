import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

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
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    try {
      const payload = jwt.verify(token, process.env.ACCESS_SECRET as string);

      // gắn thông tin user vào request để controller khác có thể dùng
      req.user = {
        id: payload['sub'],
        username: payload['username'],
      };

      return true;
    } catch (err) {
      throw new UnauthorizedException('Access token invalid or expired');
    }
  }
}
