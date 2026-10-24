import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import { APP_FILTER } from '@nestjs/core';
import {
  AcceptLanguageLocaleResolver,
  HeaderLocaleResolver,
  I18nModule,
  JsonI18nLoader,
  QueryLocaleResolver,
} from '@nestjs/i18n';

import { validationSchema } from './config/validation.js';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { appConfig } from './config/app.config.js';
import { databaseConfig } from './config/database.config.js';
import { winstonConfig } from './logger/winston.config.js';
import { redisConfig } from './config/redis.config.js';
import { mailConfig } from './config/mail.config.js';
import { storageConfig } from './config/storage.config.js';
import { securityConfig } from './config/security.config.js';

// import { AppController } from './app.controller.js';
// import { AppService } from './app.service.js';
import { LanguagesModule } from './language/languages.module.js';
import { UsersModule } from './users/users.module.js';
import { RolesModule } from './roles/roles.module.js';
import { UploadModule } from './upload/upload.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { CategoryModule } from './category/category.module.js';
import { PostModule } from './post/post.module.js';
import { BannerNameModule } from './banner-name/banner-name.module.js';
import { BannerModule } from './banner/banner.module.js';
import { SubscriberModule } from './subscribtion/subscriber.module.js';
import { MailModule } from './mail/mail.module.js';
import { join } from 'path';
import { languageCodes } from './language/language.cache.js';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      load: [
        appConfig,
        databaseConfig,
        storageConfig,
        securityConfig,
        redisConfig,
        mailConfig,
      ],

      envFilePath: [
        // `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env',
      ],

      validationSchema,
    }),
    WinstonModule.forRoot(winstonConfig),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),

        autoLoadEntities: true,

        synchronize: false, // Set to false in production to avoid data loss
        timezone: 'Z', // ⭐ Forces TypeORM to use UTC instead of the server's local time zone
      }),
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          // password: config.get<number>('REDIS_PASSWORD'),
          // user: config.get<number>('REDIS_USER'),
        },
      }),
    }),

    I18nModule.forRoot({
      defaultLocale: languageCodes[0],
      supportedLocales: languageCodes,
      fallbacks: { 
        [`${languageCodes[0]}-AT`]: languageCodes[0]
      },
      loader: new JsonI18nLoader({
        path: join(import.meta.dirname, 'i18n'),
      }),
      resolvers: [
        new QueryLocaleResolver('lang'),
        new HeaderLocaleResolver('x-lang'),
        new AcceptLanguageLocaleResolver(),
      ],
    }),

    ScheduleModule.forRoot(),

    LanguagesModule,
    UploadModule,
    RolesModule,
    UsersModule,
    AuthModule,
    CategoryModule,
    PostModule,
    BannerNameModule,
    BannerModule,
    SubscriberModule,
    MailModule,
  ],
  // controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
