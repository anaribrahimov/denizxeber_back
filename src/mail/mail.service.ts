import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BATCH_SIZE, MAIL_QUEUE, SEND_POST_EMAIL_JOB } from './mail.constants.js';
import { PostCreatedEvent } from '../post/event/post-created.event.js';
import { SubscriberService } from '../subscribtion/subscriber.service.js';
import { GetSubscribersDto } from '../subscribtion/dto/get-subscribers.dto.js';
import { SubscriberDto } from '../subscribtion/dto/subscriber.dto.js';

export interface PostEmailJobData {
  to: string;
  unsubscribeToken: string;
  title: string;
  url: string;
  excerpt: string;
  authorFullName: string;
  createdAt: Date;
  coverImageOriginal: string;
  coverImageThumbnail: string | null;
  languageName: string;
}

@Injectable()
export class MailService {
  constructor(
    @InjectQueue(MAIL_QUEUE) private readonly queue: Queue,
    private readonly subscriberService: SubscriberService,
  ) {}

  async queueNewPostNotification(event: PostCreatedEvent): Promise<void> {
    let page = 1;

    while (true) {
      const dto = new GetSubscribersDto();
      dto.page = page;
      dto.limit = BATCH_SIZE;
      const langIds = [1];

      // get subscribers
      const { data: subscribers } = await this.subscriberService.findPaginated(dto, langIds);

      if (!subscribers.length) break;

      await this.queue.addBulk(
        subscribers.map((s: SubscriberDto) => ({
          name: SEND_POST_EMAIL_JOB,
          data: {
            to: s.email,
            unsubscribeToken: s.unsubscribeToken,
            title: event.title,
            url: event.url,
            excerpt: event.excerpt,
            authorFullName: event.authorFullName,
            createdAt: event.createdAt,
            coverImageOriginal: event.coverImageOriginal!,
            coverImageThumbnail: event.coverImageThumbnail ?? null,
            languageName: event.languageName,
          } satisfies PostEmailJobData,
          opts: {
            // jobId makes it idempotent: same post + same subscriber = one email
            jobId: `post-${event.postId}-${s.id}`,
            attempts: 3,
            backoff: { 
              type: 'exponential', 
              delay: 5000 
            },
            removeOnComplete: true,
            removeOnFail: 1000,
          },
        })),
      );

      page++;
    }
  }
}
