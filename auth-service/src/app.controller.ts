import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { AccessTokenPayload } from './types/jwt-payload.interface'; // 👈 import interface

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // ============================================================
  // 🔑 AUTH.LOGIN
  // ============================================================
  @MessagePattern('auth.login')
  handleLogin(@Payload() message: any) {
    const { username, password } = message.value;
    const user = this.appService.validateUser(username, password);
    if (!user) return { error: 'Invalid credentials' };

    // ⚙️ generate tokens
    const accessToken = this.appService.generateAccessToken(user.id, username);
    const refreshToken = this.appService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username, name: user.name },
    };
  }

  // ============================================================
  // 🔄 AUTH.REFRESH
  // ============================================================
  @MessagePattern('auth.refresh')
  handleRefresh(@Payload() message: any) {
    const { refresh_token } = message.value;
    const payload = this.appService.verifyRefreshToken(refresh_token) as AccessTokenPayload | null;

    if (!payload) return { error: 'Invalid or expired refresh token' };

    // ⚙️ Tạo access token mới (payload.sub là string, convert sang number nếu cần)
    const accessToken = this.appService.generateAccessToken(
      payload.sub,
      payload.username,
    );

    return { accessToken, refreshToken: refresh_token };
  }

  // ============================================================
  // 🧾 AUTH.VERIFY
  // ============================================================
  @MessagePattern('auth.verify')
  handleVerify(@Payload() message: any) {
    const { token } = message.value;
    const payload = this.appService.verifyAccessToken(token) as AccessTokenPayload | null;

    if (!payload) return { error: 'Invalid or expired access token' };

    // ⚙️ Trả về thông tin user trong token
    return {
      user: {
        id: payload.sub,
        username: payload.username || 'unknown',
      },
    };
  }
}
