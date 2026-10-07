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
import { statuses } from '../status/status.cache.js';
import { User } from '../users/user.entity.js';
import { PostDto } from './dto/post.dto.js';
import { PostQueryDto } from './dto/post-query.dto.js';
import { createPaginatedResponse } from '../common/utils/pagination.util.js';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface.js';
import { UpdatePostDto } from './dto/update-post.dto.js';

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

  async create(
    createPostDto: CreatePostDto,
    lang: Language,
    userPrincipal: AuthUser
  ): Promise<PostDto> {
    const errors: Record<string, string[]> = {};

    // find category
    const category = await this.categoryRepository.findOne({
      where: {
        id: createPostDto.categoryId,
        langId: lang.id,
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
      errors.categoryId = ['not found'];
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

    post.isUpdating = createPostDto.isUpdating ?? false;
    post.status = status;
    post.category = category!;
    post.coverImage = coverImage;
    post.author = {
      id: userPrincipal.userId,
      email: userPrincipal.email,
    } as User;

    return PostMapper.toDto(post, this.filesPublicUrl);
  }

  async findOne(postId: string, langId: number): Promise<PostDto> {
    const post = await this.postRepository
      .createQueryBuilder('p')
      .innerJoin('p.category', 'c', 'c.langId = :langId', { langId })
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
    langId: number,
    authUserId: number,
  ): Promise<PostDto> {
    // find post
    const post = await this.postRepository
      .createQueryBuilder('p')
      .innerJoin('p.category', 'c', 'c.langId = :langId', { langId })
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
            langId,
          }
        });

      if (!category) {
        errors['categoryId'] = ['category not found'];
      } else {
        post.categoryId = dto.categoryId;
        post.category = category!;
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
        where: { id: authUserId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        }
      });

    if (
      dto.categoryId === undefined
      && dto.isUpdating === undefined
      && dto.content === undefined
      && dto.coverImageId === undefined
      && dto.statusId === undefined
      && dto.title === undefined
    ) {
      throw new ValidationException({}, 'Nothing send to update');
    }

    if (dto.isUpdating != undefined && dto.isUpdating !== post.isUpdating) {
      post.isUpdating = dto.isUpdating;
      if (dto.isUpdating) {
        post.sortAt = new Date(new Date().toISOString());
      }
    }

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
    post.lastUpdatedById = authUserId;
    post.lastUpdatedBy = lastUpdatedBy;

    // save post
    await this.postRepository.save(post);

    return PostMapper.toDto(post, this.filesPublicUrl);
  }

  async remove(
    postId: string,
    langId: number,
    authUserId: number
  ): Promise<void> {

    // find post
    const post = await this.postRepository
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.category', 'c')
      .where('c.langId = :langId', { langId })
      .andWhere('p.id = :postId', { postId })
      .select(['p.id'])
      .getOne();

    if (!post) {
      throw new NotFoundException(`Post with id "${postId}" not found`);
    }

    post.lastUpdatedById = authUserId;
    post.deletedAt = new Date(new Date().toISOString());

    await this.postRepository.save(post);
  }

  async findPaginated(
    query: PostQueryDto,
    langId: number,
  ): Promise<PaginatedResult<PostDto>> {
    const { limit, page, categoryId, statusId, title, user } = query;

    const qb = this.postRepository
      .createQueryBuilder('p')
      .leftJoin('p.category', 'c', 'c.langId = :langId', { langId })
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

  // private isDuplicateSlugError(error: unknown): boolean {
  //   return (
  //     typeof error === 'object' &&
  //     error !== null &&
  //     'code' in error &&
  //     error.code === 'ER_DUP_ENTRY'
  //   );
  // }
}
