export interface AccessTokenPayload {
  sub: string;        // userId
  username?: string;
  iat?: number;
  exp?: number;
}
