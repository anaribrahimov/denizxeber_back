
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscriber } from './subscriber.entity.js';
import { SubscriberController } from './subscriber.controller.js';
import { SubscriberService } from './subscriber.service.js';


@Module({
  imports: [
    TypeOrmModule.forFeature([Subscriber]),
  ],
  controllers: [SubscriberController],
  providers: [SubscriberService],
  exports: [SubscriberService],
})
export class SubscriberModule {}
