import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME,
  env: process.env.NODE_ENV,
  port: parseInt(process.env.APP_PORT ?? '3000', 10),
  debug: process.env.APP_DEBUG === 'true',
}));
