import { LanguageDto } from "../language/dto/language.dto.js";
import { CreateSubscriberDto } from "./dto/create-subscriber.dto.js";
import { SubscriberDto } from "./dto/subscriber.dto.js";
import { Subscriber } from "./subscriber.entity.js";
import { randomBytes } from "crypto";

export class SubscriberMapper {

  static toDto(subscriber: Subscriber) {
    const dto = new SubscriberDto();
    dto.id = subscriber.id;
    dto.email = subscriber.email;
    dto.language = subscriber.language as LanguageDto;
    dto.createdAt = subscriber.createdAt;
    dto.unsubscribeToken = subscriber.unsubscribeToken;
    return dto;
  }

  static toEntity(dto: CreateSubscriberDto) {
    const subscriber = new Subscriber();
    subscriber.email = dto.email;
    subscriber.langId = dto.langId;
    subscriber.unsubscribeToken = randomBytes(16).toString('hex') + '_' + Date.now();
    return subscriber;
  }
}
