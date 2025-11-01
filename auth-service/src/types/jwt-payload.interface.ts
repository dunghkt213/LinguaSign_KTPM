// auth-service/src/types/jwt-payload.interface.ts
/**
 * AccessTokenPayload định nghĩa cấu trúc của JWT access token
 *
 * Không kế thừa `JwtPayload` trực tiếp vì `JwtPayload.sub` được khai báo là `string`
 * trong kiểu của thư viện. Ở đây chúng ta dùng `number` cho `sub` (ID người dùng),
 * và khai báo thủ công các trường phổ biến (iat/exp).
 */
export interface AccessTokenPayload {
  sub: number;       // ID người dùng (numeric)
  username: string;  // Tên đăng nhập
  iat?: number;
  exp?: number;
}
