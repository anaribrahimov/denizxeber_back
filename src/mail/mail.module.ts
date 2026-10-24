import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { SubscriberModule } from '../subscribtion/subscriber.module.js';
import { MAIL_QUEUE } from './mail.constants.js';
import { MailService } from './mail.service.js';
import { MailProcessor } from './mail.processor.js';
import { I18nService } from '@nestjs/i18n';

@Module({
  imports: [
    SubscriberModule,
    BullModule.registerQueue({ name: MAIL_QUEUE }),
    MailerModule.forRootAsync({
      inject: [ConfigService, I18nService],
      useFactory: (config: ConfigService, i18n: I18nService) => ({
        transport: {
          host: config.getOrThrow('mail.host'),
          port: config.getOrThrow<number>('mail.port'),
          secure: false,
          auth: {
            user: config.getOrThrow('mail.user'),
            pass: config.getOrThrow('mail.password'),
          },
        },
        defaults: { 
          from: `"My Blog" <${config.getOrThrow('mail.from')}>` 
        },
        template: {
          dir: join(import.meta.dirname, 'templates'),
          adapter: new HandlebarsAdapter({
            t: (key: string, options: any) => {
              const lang = options.data.root.locale;
              return i18n.t(`${key}`, { args: options.hash, locale: lang });
            },
          }),
          options: { strict: true },
        },
      }),
    }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
