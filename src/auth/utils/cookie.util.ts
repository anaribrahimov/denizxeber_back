import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

export const REFRESH_COOKIE_NAME = 'refresh_token';

export function setRefreshCookie(
  res: Response,
  token: string,
  expiresAt: Date,
  config: ConfigService,
) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.get('NODE_ENV') === 'production',
    sameSite: 'strict',
    path: '/auth', // only sent to /auth/* routes (refresh, logout)
    expires: expiresAt,
  });
}

export function clearRefreshCookie(res: Response, config: ConfigService) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: config.get('NODE_ENV') === 'production',
    sameSite: 'strict',
    path: '/auth',
  });
}
