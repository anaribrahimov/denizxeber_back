import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { MAIL_QUEUE } from './mail.constants.js';
import { PostEmailJobData } from './mail.service.js';
import { MailerService } from '@nestjs-modules/mailer';
import { I18nService } from '@nestjs/i18n';

@Processor(MAIL_QUEUE, { concurrency: 5 })
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
    private readonly i18nService: I18nService
  ) {
    super();
  }

  async process(job: Job<PostEmailJobData>): Promise<void> {
    const {
      to,
      title,
      excerpt,
      authorFullName,
      coverImageOriginal,
      coverImageThumbnail,
      createdAt,
      url,
      languageName,
    } = job.data;
    const appName = this.config.get<string>(`app.publicName.${languageName}`);
    const appUrl = this.config.get<string>(`app.publicUrl.${languageName}`);

    const subject = this.i18nService.t(
        'emails.post_published_badge', { 
          locale: languageName, 
        }
      )
      + ': ' + excerpt;

    await this.mailer.sendMail({
      to,
      subject,
      template: 'new-post', // resolves to templates/new-post.hbs
      context: {
        locale: languageName,
        appName,
        appUrl,
        postTitle: title,
        authorFullName,
        postExcerpt: excerpt,
        postUrl: url,
        postCoverImageUrl: coverImageOriginal,
        // unsubscribeUrl: `${appUrl}/subscribers/unsubscribe/${unsubscribeToken}`,
      },
      // headers: {
        // Helps Gmail/Outlook show a native "Unsubscribe" button
        // 'List-Unsubscribe': `<${appUrl}/subscribers/unsubscribe/${unsubscribeToken}>`,
      // },
    });

    this.logger.debug(`Sent "${title}" to ${to}`);
  }
}
