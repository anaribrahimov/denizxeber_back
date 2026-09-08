import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { validationSchema } from './config/validation.js';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { appConfig } from './config/app.config.js';
import { databaseConfig } from './config/database.config.js';
import { LanguagesModule } from './language/languages.module.js';
import { UsersModule } from './users/users.module.js';
import { RolesModule } from './roles/roles.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { storageConfig } from './config/storage.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      load: [
        appConfig,
        databaseConfig,
        storageConfig,
      ],

      envFilePath: [
        // `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env',
      ],

      validationSchema,
    }),
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
      }),
    }),

    LanguagesModule,
    UploadsModule,
    RolesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
