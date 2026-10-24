import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PostCreatedEvent } from '../event/post-created.event.js';
import { MailService } from '../../mail/mail.service.js';

@Injectable()
export class PostCreatedListener {
  // private readonly logger = new Logger(PostCreatedListener.name);

  constructor(
    private readonly mailService: MailService,
  ) {}

  @OnEvent(PostCreatedEvent.eventName, { async: true })
  async handle(event: PostCreatedEvent) {
    try {
      await this.mailService.queueNewPostNotification(event);
    } catch (err) {
      // Never let email problems break post creation
      // this.logger.error(`Failed to enqueue emails for post ${event.postId}`, err);
      console.log(err);
    }
  }
}
