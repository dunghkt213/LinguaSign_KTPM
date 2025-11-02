import {
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { TokenService } from './token/token.service';
@Injectable()
export class AppService {
  constructor(
    private readonly tokenService: TokenService,

    @Inject('USER_SERVICE')
    private readonly userClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // cần để send().toPromise() hoạt động
    this.userClient.subscribeToResponseOf('user.getByUsername');
    this.userClient.subscribeToResponseOf('user.create');
  }

  // ---------------------------
  // 1. Lấy user từ user-service và validate password
  // ---------------------------
  async validateUser(username: string, password: string) {
    console.log('🔍 Validating user via user-service:', username);

    const user = await this.userClient
      .send('user.getByUsername', { username })
      .toPromise();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new UnauthorizedException('Invalid password');
    }

    return user;
  }

  // ---------------------------
  // 2. Access Token (15 phút)
  // ---------------------------
  generateAccessToken(userId: string, username: string) {
    const secret = process.env.ACCESS_SECRET;
    if (!secret) throw new Error('ACCESS_SECRET missing');

    return jwt.sign(
      { sub: userId },
      secret,
      { expiresIn: process.env.ACCESS_EXPIRES_IN || '15m' as any },
    );
  }

  // ---------------------------
  // 3. Refresh Token (30 ngày)
  // - sinh JWT
  // - lưu vào DB (để có thể revoke + check hết hạn)
  // - trả token string
  // ---------------------------
  async generateRefreshToken(userId: string) {
    const secret = process.env.REFRESH_SECRET;
    if (!secret) throw new Error('REFRESH_SECRET missing');

    // sống 30 ngày
    const refreshExpiresIn = process.env.REFRESH_EXPIRES_IN || '30d';

      const refreshToken = jwt.sign(
    { sub: userId },
    secret,
    { expiresIn: refreshExpiresIn as any }, // 👈 ép kiểu tránh TS lỗi
  );

    // Tính expiresAt theo exp của JWT
    const decoded: any = jwt.decode(refreshToken);
    const expMs = decoded?.exp ? decoded.exp * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(expMs);

    // lưu DB
    await this.tokenService.saveToken(userId, refreshToken, expiresAt);

    return refreshToken;
  }

  // ---------------------------
  // 4. Verify access token
  // ---------------------------
  verifyAccessToken(token: string) {
    try {
      const secret = process.env.ACCESS_SECRET;
      if (!secret) throw new Error('ACCESS_SECRET missing');
      return jwt.verify(token, secret);
    } catch {
      return null;
    }
  }

  // ---------------------------
  // 5. Verify refresh token (decode + check DB)
  // ---------------------------
  async verifyRefreshToken(token: string) {
    try {
      const secret = process.env.REFRESH_SECRET;
      if (!secret) throw new Error('REFRESH_SECRET missing');

      // check chữ ký & exp của JWT
      const decoded = jwt.verify(token, secret) as any;

      // check token trong DB (revoked? expired?)
      const validInDb = await this.tokenService.isTokenValid(token);
      if (!validInDb) {
        throw new UnauthorizedException(
          'Refresh token revoked or expired in DB',
        );
      }

      return decoded; // { sub: userId, iat, exp }
    } catch (err) {
      return null;
    }
  }

  // ---------------------------
  // 6. LOGIN
  // - check user/pass
  // - cấp accessToken & refreshToken
  // - trả refreshTokenInfo để Gateway set cookie HttpOnly
  // ---------------------------
  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);

    const accessToken = this.generateAccessToken(user._id, user.username);
    const refreshToken = await this.generateRefreshToken(user._id);

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshTokenInfo: {
        name: 'refreshToken',
        value: refreshToken,
        options: {
          httpOnly: true,
          secure: true,
          sameSite: 'strict' as const,
          path: '/auth/refresh',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
        },
      },
    };
  }

  // ---------------------------
  // 7. REGISTER
  // - gọi user-service tạo user
  // - cấp token như login
  // ---------------------------
  async registerUser(dto: {
    username: string;
    password: string;
    email: string;
    name: string;
  }) {
    // user-service sẽ tự hash password khi tạo
    const createdUser = await this.userClient
      .send('user.create', dto)
      .toPromise();

    if (!createdUser || (createdUser as any)?.error) {
      throw new UnauthorizedException(
        (createdUser as any)?.error || 'Failed to create user',
      );
    }

    const accessToken = this.generateAccessToken(
      createdUser._id,
      createdUser.username,
    );
    const refreshToken = await this.generateRefreshToken(createdUser._id || createdUser.id);


    return {
      user: createdUser,
      accessToken,
      refreshTokenInfo: {
        name: 'refreshToken',
        value: refreshToken,
        options: {
          httpOnly: true,
          secure: true,
          sameSite: 'strict' as const,
          path: '/auth/refresh',
          maxAge: 30 * 24 * 60 * 60 * 1000,
        },
      },
    };
  }

  // ---------------------------
  // 8. REFRESH ACCESS TOKEN
  // - nhận refreshToken từ Gateway
  // - verify + check DB
  // - nếu ok => tạo access token mới
  // - KHÔNG tạo refresh mới (vẫn giữ token cũ tới khi hết hạn 30d)
  // ---------------------------
  async refreshAccessToken(refreshToken: string) {
    const decoded = await this.verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const userId = decoded.sub as string;
    // username không nằm trong refresh token => tùy chọn:
    // có thể yêu cầu user-service fetch lại username
    const user = await this.userClient
      .send('user.get', { id: userId })
      .toPromise();

    const newAccessToken = this.generateAccessToken(
      userId,
      user?.username || '',
    );

    return {
      accessToken: newAccessToken,
      // gửi lại cookie y như cũ (để gia hạn maxAge phía browser)
      refreshTokenInfo: {
        name: 'refreshToken',
        value: refreshToken,
        options: {
          httpOnly: true,
          secure: true,
          sameSite: 'strict' as const,
          path: '/auth/refresh',
          maxAge: 30 * 24 * 60 * 60 * 1000,
        },
      },
    };
  }

  // ---------------------------
  // 9. LOGOUT
  // - revoke refresh token trong DB
  // ---------------------------
  async revoke(refreshToken: string) {
    await this.tokenService.revokeToken(refreshToken);
    return { revoked: true };
  }
}
