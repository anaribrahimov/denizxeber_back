import { registerAs } from '@nestjs/config';

export const securityConfig = registerAs('security', () => ({
  jwtAccessSecret: process.env.JWY_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWY_REFRESH_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
}));
