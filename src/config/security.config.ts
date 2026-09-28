import { registerAs } from '@nestjs/config';

export const securityConfig = registerAs('security', () => ({
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  refreshTokenTtlDays: process.env.REFRESH_TOKEN_TTL_DAYS ?? 7,
}));
