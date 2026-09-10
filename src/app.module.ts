import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { validationSchema } from './config/validation.js';

// import { AppController } from './app.controller.js';
// import { AppService } from './app.service.js';
import { appConfig } from './config/app.config.js';
import { databaseConfig } from './config/database.config.js';
import { LanguagesModule } from './language/languages.module.js';
import { UsersModule } from './users/users.module.js';
import { RolesModule } from './roles/roles.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { storageConfig } from './config/storage.config.js';
import { AuthModule } from './auth/auth.module.js';
import { securityConfig } from './config/security.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      load: [
        appConfig,
        databaseConfig,
        storageConfig,
        securityConfig,
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
        timezone: 'Z', // ⭐ Forces TypeORM to use UTC instead of the server's local time zone
      }),
    }),

    LanguagesModule,
    UploadsModule,
    RolesModule,
    UsersModule,
    AuthModule,
  ],
  // controllers: [AppController],
  // providers: [AppService],
})
export class AppModule {}
