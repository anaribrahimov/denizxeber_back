import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Subscriber } from "./subscriber.entity.js";
import { In, Repository } from "typeorm";
import { CreateSubscriberDto } from "./dto/create-subscriber.dto.js";
import { SubscriberMapper } from "./subscriber.mapper.js";
import { SubscriberDto } from "./dto/subscriber.dto.js";
import { ValidationException } from "../common/exceptions/validation.exception.js";
import { GetSubscribersDto } from "./dto/get-subscribers.dto.js";
import { AuthUser } from "../auth/interfaces/auth-user.interface.js";
import { LanguageDto } from "../language/dto/language.dto.js";
import { PaginatedResult } from "../common/interfaces/paginated-result.interface.js";
import { createPaginatedResponse } from "../common/utils/pagination.util.js";

@Injectable()
export class SubscriberService {

  constructor(
    @InjectRepository(Subscriber)
    private readonly subscriberRepository: Repository<Subscriber>,
  ) {}

  async create(dto: CreateSubscriberDto): Promise<SubscriberDto> {
    // check email
    const exists = await this.subscriberRepository
      .existsBy({ email: dto.email });

    if (exists) {
      throw new ValidationException({
        email: ['Email has already been subscribed'],
      })
    }

    const subscriber = await this.subscriberRepository
      .save(SubscriberMapper.toEntity(dto))

    return SubscriberMapper.toDto(subscriber);
  }

  async findPaginated(
    dto: GetSubscribersDto,
    langIds: number[]
  ): Promise<PaginatedResult<SubscriberDto>> {
    const { limit, page, email } = dto;

    const qb = this.subscriberRepository
      .createQueryBuilder('s')
      .where('s.langId IN (:...langIds)', { langIds })

    if (email?.trim()) {
      qb.where('s.email LIKE :email', { email: `%${email.trim()}%` })
    }

    qb
    .orderBy({
      's.id': 'DESC',
    })
    .skip((page - 1) * limit)
    .take(limit);

    // console.log(qb.getSql());

    const [data, total] = await qb.getManyAndCount();

    return createPaginatedResponse(
      data.map(SubscriberMapper.toDto),
      total,
      page,
      limit,
    )
  }

  async remove(id: number, userPrincipal: AuthUser): Promise<void> {
    const subscriber = await this.subscriberRepository
      .findOne({
        where: {
          id: id,
          langId: In(userPrincipal.langIds),
        }
      })

    if (!subscriber) {
      throw new NotFoundException(`Subscriber not found: ${id}`);
    }

    await this.subscriberRepository.delete(id);
  }

  async unsubscribe(token: string): Promise<void> {
    // remove subscriber
    await this.subscriberRepository
      .delete({
        unsubscribeToken: token
      });
  }
}
