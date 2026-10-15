import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';

import { Post } from './post.entity.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { AuthUser } from '../auth/interfaces/auth-user.interface.js';
import { Language } from '../language/language.entity.js';
import { Category } from '../category/category.entity.js';
import { ValidationException } from '../common/exceptions/validation.exception.js';
import { Upload, UploadType } from '../upload/upload.entity.js';
import { PostMapper } from './post.mapper.js';
import { ConfigService } from '@nestjs/config';
import { StatusEnum, statuses } from '../status/status.cache.js';
import { User } from '../users/user.entity.js';
import { PostDto } from './dto/post.dto.js';
import { PostQueryDto } from './dto/post-query.dto.js';
import { createPaginatedResponse } from '../common/utils/pagination.util.js';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import moment from 'moment';
import { PublicPostDto } from './public/dto/public-post.dto.js';
import { PublicPostMapper } from './public/public-post.mapper.js';
import { PublicPostQueryDto } from './public/dto/public-post-query.dto.js';
import { prioritiesCached } from '../priority/priority.cache.js';
import { decodePostCursor, generatePostCursor, PostCursor } from './util/pagination.util.js';
import { CursorPaginatedResponse } from '../common/interfaces/paginated-response.interface.js';
import { CursorPaginationMetaDto } from '../common/dto/cursor-pagination-meta.dto.js';

export const COVER_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

@Injectable()
export class PostService {

  private readonly filesPublicUrl: string;

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly configService: ConfigService,
  ) {
    this.filesPublicUrl =
      this.configService.getOrThrow<string>('app.filesPublicUrl');
  }

  private async getCoverImages(coverImageIds: string[]): Promise<Upload[]> {
    return this.uploadRepository
      .find({
        where: { id: In(coverImageIds) },
        relations: { versions: true },
      });
  }

  async create(
    createPostDto: CreatePostDto,
    userPrincipal: AuthUser
  ): Promise<PostDto> {
    const errors: Record<string, string[]> = {};

    // find category
    const category = await this.categoryRepository.findOne({
      where: {
        id: createPostDto.categoryId,
        langId: In(userPrincipal.langIds)
      },
      relations: {
        language: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        language: {
          id: true,
          name: true,
        },
      },
    });

    if (!category) {
      errors.categoryId = ['category not found'];
    }

    // find cover image
    let coverImage: Upload | null | undefined = null;

    if (createPostDto.coverImageId) {
      coverImage =
        await this.uploadRepository.findOne({
          where: {
            id: createPostDto.coverImageId,
            type: UploadType.PUBLIC,
          },
          relations: {
            versions: true,
          }
        });

      if (!coverImage) {
        errors.coverImageId = ['not found'];
      }

      if (coverImage && !COVER_IMAGE_MIME_TYPES.includes(coverImage.fileMimeType)) {
        errors.coverImageId = [
          'invalid file type. '
          + `Allowed types: ${COVER_IMAGE_MIME_TYPES.join(', ')}`
        ];
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationException(errors);
    }

    // find status
    const status = createPostDto.statusId
      ? (statuses.find((s) => s.id === createPostDto.statusId) ?? null)
      : null;

    // save post
    const post = await this.postRepository
      .save(PostMapper.toEntity(createPostDto, userPrincipal.userId));

    // post.isUpdating = createPostDto.isUpdating ?? false;
    post.status = status;
    post.category = category!;
    post.coverImage = coverImage;
    post.author = {
      id: userPrincipal.userId,
      email: userPrincipal.email,
    } as User;

    return PostMapper.toDto(post, this.filesPublicUrl);
  }

  async findOne(
    postId: string, 
    userPrincipal: AuthUser
  ): Promise<PostDto> {
    const post = await this.postRepository
      .createQueryBuilder('p')
      .innerJoin(
        'p.category', 
        'c', 
        'c.langId IN (:...langIds)', 
        { langIds: userPrincipal.langIds }
      )
      .leftJoin('p.author', 'a')
      .leftJoin('p.status', 's')
      .leftJoin('p.lastUpdatedBy', 'lu')
      .addSelect([
        'c.id',
        'c.name',
        'c.slug',
        'a.id',
        'a.email',
        'a.firstName',
        'a.lastName',
        's.id',
        's.name',
        'lu.id',
        'lu.email',
        'lu.firstName',
        'lu.lastName',
      ])
      .andWhere('p.id = :postId', { postId })
      .getOne();

    if (!post) {
      throw new NotFoundException(`Post with id "${postId}" not found`);
    }

    // find cover image
    if (post.coverImageId) {
      const coverImage = await this.uploadRepository
        .findOne({
          where: { id: +post.coverImageId },
          relations: { versions: true },
        });

      // set post cover image
      post.coverImage = coverImage ?? null;
    }

    return PostMapper.toDto(post, this.filesPublicUrl);
  }

  async update(
    id: string,
    dto: UpdatePostDto,
    userPrincipal: AuthUser,
  ): Promise<PostDto> {
    // find post
    const post = await this.postRepository
      .createQueryBuilder('p')
      .innerJoin(
        'p.category', 
        'c', 
        'c.langId IN (:...langIds)', 
        { langIds: userPrincipal.langIds }
      )
      .leftJoin('p.author', 'a')
      .leftJoin('p.status', 's')
      .leftJoin('p.lastUpdatedBy', 'lu')
      .addSelect([
        'c.id',
        'c.name',
        'c.slug',
        'a.id',
        'a.email',
        'a.firstName',
        'a.lastName',
        's.id',
        's.name',
        'lu.id',
        'lu.email',
        'lu.firstName',
        'lu.lastName',
      ])
      .andWhere('p.id = :id', { id })
      .getOne();

    if (!post) {
      throw new NotFoundException(`Post not found, id: ${id}`);
    }

    if (
      dto.categoryId === undefined
      && dto.priorityId === undefined
      && dto.content === undefined
      && dto.coverImageId === undefined
      && dto.statusId === undefined
      && dto.title === undefined
    ) {
      throw new ValidationException({}, 'Nothing send to update');
    }

    // find post cover image
    post.coverImage = post.coverImageId
      ? await this.uploadRepository
        .findOne({
          where: { id: post.coverImageId },
          relations: {
            versions: true
          }
        })
      : null;

    const errors: Record<string, string[]> = {};

    if (dto.categoryId && dto.categoryId !== post.categoryId) {
      const category = await this.categoryRepository
        .findOne({
          where: {
            id: dto.categoryId,
            langId: In(userPrincipal.langIds),
          }
        });

      if (!category) {
        errors['categoryId'] = ['category not found'];
      } else {
        post.categoryId = dto.categoryId;
        post.category = category!;
      }
    }

    if (dto.priorityId !== undefined) {
      if (!dto.priorityId) {
        post.priorityId = null;
      } else {
        if (dto.priorityId !== post.priorityId) {
          if (
            post.priorityId !== prioritiesCached.updating.id 
            && dto.priorityId === prioritiesCached.updated.id
          ) {
            errors['prirityId'] = ['Can not directly change to updated priority'];
          } else {
            post.priorityId = dto.priorityId;
            post.sortAt = new Date(new Date().toISOString());
          }
        }
      }
    }


    if (dto.coverImageId !== undefined) {
      if (!dto.coverImageId) {
        post.coverImageId = null;
        post.coverImage = null;
      } else {
        // find cover image
        const coverImage = await this.uploadRepository
          .findOne({
            where: {
              id: dto.coverImageId,
            },
            relations: {
              versions: true
            }
          });

        if (!coverImage) {
          errors['coverImageId'] = ['Cover image not found'];
        } else {
          post.coverImageId = dto.coverImageId;
          post.coverImage = coverImage;
        }
      }
    }

    if (Object.keys(errors).length) {
      throw new ValidationException(errors);
    }

    // last updater
    const lastUpdatedBy = await this.userRepository
      .findOne({
        where: { id: userPrincipal.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        }
      });

    if (dto.statusId) {
      const status = statuses.find((status) => status.id === dto.statusId);
      post.status = status!;
    }

    if (dto.title) {
      post.title = dto.title;
    }

    if (dto.content) {
      post.content = dto.content;
    }

    // set post last updated by
    post.lastUpdatedById = userPrincipal.userId;
    post.lastUpdatedBy = lastUpdatedBy;

    // save post
    await this.postRepository.save(post);

    return PostMapper.toDto(post, this.filesPublicUrl);
  }

  async remove(
    postId: string,
    userPrincipal: AuthUser
  ): Promise<void> {

    // find post
    const post = await this.postRepository
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.category', 'c')
      .where('c.langId IN (:...langIds)', { langIds: userPrincipal.langIds })
      .andWhere('p.id = :postId', { postId })
      .select(['p.id'])
      .getOne();

    if (!post) {
      throw new NotFoundException(`Post with id "${postId}" not found`);
    }

    post.lastUpdatedById = userPrincipal.userId;
    post.deletedAt = new Date(new Date().toISOString());

    await this.postRepository.save(post);
  }

  async findPaginated(
    query: PostQueryDto,
    userPrincipal: AuthUser,
    currentLang: Language,
  ): Promise<PaginatedResult<PostDto>> {
    const { limit, page, categoryId, statusId, title, user } = query;

    // find langids
    const langIds = currentLang ? [currentLang.id] : userPrincipal.langIds;

    const qb = this.postRepository
      .createQueryBuilder('p')
      .innerJoin('p.category', 'c', 'c.langId IN (:...langIds)', { langIds })
      .leftJoin('p.author', 'a')
      .addSelect([
        'c.id',
        'c.name',
        'c.slug',
        'c.langId',
        'a.id',
        'a.email',
        'a.firstName',
        'a.lastName',
      ])

    if (categoryId) {
      qb.andWhere('p.categoryId = :categoryId', { categoryId })
    }

    if (statusId) {
      qb.andWhere('p.statusId = :statusId', { statusId });
    }

    if (title?.trim()) {
      qb.andWhere('p.title LIKE :title', { title: `%${title.trim()}%` });
    }

    if (user?.trim()) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('a.email LIKE :user')
            .orWhere('a.firstName LIKE :user')
            .orWhere('a.lastName LIKE :user');
        }),
        {
          user: `%${user.trim()}%`,
        },
      );
    }

    qb
      .orderBy({
        'p.isUpdating': 'DESC',
        'p.sort_at': 'DESC'
      })
      .skip((page - 1) * limit)
      .take(limit);

    // console.log(qb.getSql());

    const [data, total] = await qb.getManyAndCount();

    const coverImageIds = data
      .map((post) => post.coverImageId)
      .filter((id): id is number => !!id);

    // find cover images of posts
    const coverImages = coverImageIds.length
      ? await this.uploadRepository.find({
        where: {
          id: In(coverImageIds),
        },
        relations: {
          versions: true,
        },
      })
      : [];

    const coverImagesMap = new Map(
      coverImages.map((image) => [image.id, image]),
    );

    const statusesMap = new Map(
      statuses.map((status) => [status.id, status]),
    );

    const result: PostDto[] = data.map((post) => {
      post.coverImage = post.coverImageId
        ? coverImagesMap.get(post.coverImageId) as Upload
        : null;

      post.status = post.statusId
        ? statusesMap.get(post.statusId) ?? null
        : null;

      return PostMapper.toDto(post, this.filesPublicUrl)
    });

    return createPaginatedResponse(result, total, page, limit);
  }

  public async todaysMostRead(language: Language): Promise<PublicPostDto[]> {
    const limit = 5;
    const today = moment().utcOffset(0).format('YYYY-MM-DD');

    const posts = await this.postRepository
      .createQueryBuilder('p')
      .innerJoin(
        'p.category', 
        'c', 
        'c.langId = :langId', 
        { langId: language.id }
      )
      .innerJoin('c.language', 'l')
      .leftJoin('p.author', 'a')
      .select([
        'p.id',
        'p.title',
        'p.slug',
        'p.createdAt',
        'p.updatedAt',
        'p.isUpdating',
        'p.sortAt',
        'p.viewCount',
        'p.coverImageId',
        'p.priorityId',
        'c.id',
        'c.name',
        'c.slug',
        'l.name',
        'l.id',
        'a.id',
        'a.firstName',
        'a.lastName',
      ])
      .where('p.statusId = :statusId', { statusId: StatusEnum.Published })
      .where('p.createdAt >= :today', { today })
      .orderBy('p.viewCount', 'DESC')
      .limit(limit)
      .getMany();

    const coverImageIds = posts
      .map((post) => post.coverImageId?.toString())
      .filter((id): id is string => !!id);

    const coverImages = await this.getCoverImages(coverImageIds);

    const coverImagesMap = new Map(
      coverImages.map((image) => [image.id, image]),
    );

    const result: PublicPostDto[] = posts.map((post) => {
      post.coverImage = post.coverImageId
        ? coverImagesMap.get(post.coverImageId) as Upload
        : null;

      return PublicPostMapper.toDto(post, this.filesPublicUrl)
    });

    return result;
  }

  public async findBySlugForPublic(
    postSlug: string,
  ): Promise<PublicPostDto> {
    const post = await this.postRepository
      .createQueryBuilder('p')
      .innerJoin('p.category', 'c')
      .innerJoin('c.language', 'l')
      .leftJoin('p.author', 'a')
      .select([
        'p.id',
        'p.title',
        'p.slug',
        'p.createdAt',
        'p.updatedAt',
        'p.isUpdating',
        'p.sortAt',
        'p.viewCount',
        'p.coverImageId',
        'p.content',
        'p.priorityId',
        'c.id',
        'c.name',
        'c.slug',
        'l.id',
        'l.name',
        'a.id',
        'a.firstName',
        'a.lastName',
      ])
      .where('p.slug = :postSlug', { postSlug })
      .andWhere('p.statusId = :statusId', { statusId: StatusEnum.Published })
      .getOne();

    if (!post) {
      throw new NotFoundException(`Post with slug "${postSlug}" not found`);
    }

    // increase post view count
    post.viewCount++;

    // save post
    await this.postRepository.save(post);

    // get cover images
    if (post.coverImageId) {
      const coverImages = await this.getCoverImages([post.coverImageId.toString()]);
      const coverImage = coverImages[0];
      if (coverImage) {
        post.coverImage = coverImage;
      }
    }

    return PublicPostMapper.toDto(post, this.filesPublicUrl);
  }

  public async getSliderAndOtherPosts(
    currentLang: Language
  ): Promise<PublicPostDto[]> {
    const posts = await this.postRepository
      .createQueryBuilder('p')
      .innerJoin('p.category', 'c', 'c.langId = :langId', { langId: currentLang.id })
      .innerJoin('c.language', 'l')
      .leftJoin('p.author', 'a')
      .select([
        'p.id',
        'p.title',
        'p.slug',
        'p.createdAt',
        'p.updatedAt',
        'p.isUpdating',
        'p.sortAt',
        'p.viewCount',
        'p.coverImageId',
        'p.priorityId',
        'c.id',
        'c.name',
        'c.slug',
        'l.name',
        'l.id',
        'a.id',
        'a.firstName',
        'a.lastName',
      ])
      .where('p.statusId = :statusId', { statusId: StatusEnum.Published })
      .orderBy('p.isUpdating', 'DESC')
      .orderBy('p.sortAt', 'DESC')
      .limit(7)
      .getMany();

    const coverImageIds = posts
      .map((post) => post.coverImageId?.toString())
      .filter((id): id is string => !!id);

    const coverImages = await this.getCoverImages(coverImageIds);

    const coverImagesMap = new Map(
      coverImages.map((image) => [image.id, image]),
    );

    const result: PublicPostDto[] = posts.map((post) => {
      post.coverImage = post.coverImageId
        ? coverImagesMap.get(post.coverImageId) as Upload
        : null;

      return PublicPostMapper.toDto(post, this.filesPublicUrl)
    });

    return result;
  }

  public async findPostCursorPaginated(
    queryDto: PublicPostQueryDto,
    currentLanguage: Language | null
  ): Promise<CursorPaginatedResponse<PublicPostDto>> {
    const take = queryDto.limit + 1;

    const cursor: PostCursor | null = queryDto.afterCursor
      ? decodePostCursor(queryDto.afterCursor)
      : null;

    const qb = this.postRepository
      .createQueryBuilder('p')
      .leftJoin('p.author', 'a')
      .select([
        'p.id',
        'p.title',
        'p.slug',
        'p.createdAt',
        'p.updatedAt',
        'p.isUpdating',
        'p.sortAt',
        'p.viewCount',
        'p.coverImageId',
        'p.priorityId',
        'c.id',
        'c.name',
        'c.slug',
        'l.name',
        'l.id',
        'a.id',
        'a.firstName',
        'a.lastName',
      ]);

    if (currentLanguage?.id) {
      qb.innerJoin(
        'p.category', 
        'c', 
        'c.langId = :langId', 
        { langId: currentLanguage.id }
      );
    } else {
      qb.innerJoin('p.category', 'c');
    }

    qb.innerJoin('c.language', 'l')

    if (queryDto.categoryId) {
      qb.andWhere('p.categoryId = :categoryId', { categoryId: queryDto.categoryId })
    }

    qb.andWhere('p.statusId = :statusId', { statusId: StatusEnum.Published });

    if (queryDto.authorId) {
      qb.andWhere('p.author_id = :authorId', { authorId: queryDto.authorId })
    }

    if (cursor) {
      qb.andWhere(
        `(
          p.isUpdating < :isUpdating
          OR (p.isUpdating = :isUpdating AND p.sortAt < :sortAt)
          OR (p.isUpdating = :isUpdating AND p.sortAt = :sortAt AND p.id < :id)
        )`,
        {
          isUpdating: cursor.isUpdating,
          sortAt: cursor.sortAt,
          id: cursor.id,
        },
      );
    }

    qb
      .orderBy({
        'p.isUpdating': 'DESC',
        'p.sort_at': 'DESC',
        'p.id': 'DESC',
      })
      .take(take);

    const [posts, total] = await qb.getManyAndCount();

    const meta: CursorPaginationMetaDto = {
      total,
      limit: queryDto.limit,
      lastCursor: null,
      hasNextPage: false,
    }

    if (!posts.length) {
      return { data: [], meta }
    }

    if (posts.length > queryDto.limit) {
      meta.hasNextPage = true;
      posts.pop(); // remove last record
    }

    const coverImageIds = posts
      .map((post) => post.coverImageId?.toString())
      .filter((id): id is string => !!id);

    const coverImages = await this.getCoverImages(coverImageIds);

    const coverImagesMap = new Map(
      coverImages.map((image) => [image.id, image]),
    );

    const result: PublicPostDto[] = posts.map((post) => {
      post.coverImage = post.coverImageId
        ? coverImagesMap.get(post.coverImageId) as Upload
        : null;

      return PublicPostMapper.toDto(post, this.filesPublicUrl)
    });

    // set meta last cursor
    meta.lastCursor = result.at(-1)?.cursor ?? null;

    return {
      data: result,
      meta,
    }
  }
}
