// auth-service/src/types/jwt-payload.interface.ts
import { JwtPayload } from 'jsonwebtoken';

/**
 * AccessTokenPayload định nghĩa cấu trúc của JWT access token
 */
export interface AccessTokenPayload extends JwtPayload {
  sub: string;       // ID người dùng
  username: string;  // Tên đăng nhập
}
