import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME,
  env: process.env.NODE_ENV,
  port: parseInt(process.env.APP_PORT ?? '3000', 10),
  debug: process.env.APP_DEBUG === 'true',
  url: process.env.APP_URL,
  filesPublicUrl: process.env.FILES_PUBLIC_URL,
  postPreviewUrl: process.env.POST_PREVIEW_URL,
  publicName: {
    az: process.env.PUBLIC_APP_NAME_AZ,
    en: process.env.PUBLIC_APP_NAME_EN,
    tr: process.env.PUBLIC_APP_NAME_TR,
    ru: process.env.PUBLIC_APP_NAME_RU,
    kz: process.env.PUBLIC_APP_NAME_KZ,
    tm: process.env.PUBLIC_APP_NAME_TM,
  },
  publicUrl: {
    az: process.env.PUBLIC_APP_URL_AZ,
    en: process.env.PUBLIC_APP_URL_EN,
    tr: process.env.PUBLIC_APP_URL_TR,
    ru: process.env.PUBLIC_APP_URL_RU,
    kz: process.env.PUBLIC_APP_URL_KZ,
    tm: process.env.PUBLIC_APP_URL_TM,
  },
}));
