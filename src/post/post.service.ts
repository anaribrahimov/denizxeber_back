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
import { decodePostCursor, PostCursor } from './util/pagination.util.js';
import { CursorPaginatedResponse } from '../common/interfaces/paginated-response.interface.js';
import { CursorPaginationMetaDto } from '../common/dto/cursor-pagination-meta.dto.js';
import { CategoryAndSliderPostsResponseDto, CategoryPostItem } from './public/dto/category-slider-posts-response.dto.js';

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
    const coverImage = 
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
      .withDeleted()
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
      .andWhere('p.deletedAt IS NULL')
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
      .withDeleted()
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
        'c.langId',
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
      .andWhere('p.deletedAt IS NULL')
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
            langId: post.category.langId,
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
      if (dto.coverImageId === null) {
        post.coverImageId = null;
        post.coverImage = null;
      } else {
        // find cover image
        const coverImage = await this.uploadRepository
          .findOne({
            where: {
              id: dto.coverImageId,
              type: UploadType.PUBLIC,
            },
            relations: {
              versions: true
            }
          });

        if (!coverImage) {
          errors['coverImageId'] = ['Cover image not found'];
        } else {
          if (!COVER_IMAGE_MIME_TYPES.includes(coverImage.fileMimeType)) {
            errors.coverImageId = [
              'invalid file type. '
              + `Allowed types: ${COVER_IMAGE_MIME_TYPES.join(', ')}`
            ];
          } else {
            post.coverImageId = dto.coverImageId;
            post.coverImage = coverImage;
          }
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
    const { limit, page, categoryId, statusId, title, user, priorityId } = query;

    // find langids
    const langIds = currentLang ? [currentLang.id] : userPrincipal.langIds;

    const qb = this.postRepository
      .createQueryBuilder('p')
      .withDeleted()
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

    if (priorityId) {
      qb.andWhere('p.priorityId = :priorityId', { priorityId });
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
      .andWhere('p.deletedAt IS NULL')
      .orderBy({
        'p.id': 'DESC',
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
    const today = moment().subtract(1, 'days').utcOffset(0).format('YYYY-MM-DD');

    const posts = await this.postRepository
      .createQueryBuilder('p')
      .withDeleted()
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
      .andWhere('p.createdAt >= :today', { today })
      .andWhere('p.deletedAt IS NULL')
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
      .withDeleted()
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
      .andWhere('p.deletedAt IS NULL')
      .getOne();

    if (!post) {
      throw new NotFoundException(`Post with slug "${postSlug}" not found`);
    }

    await this.postRepository
      .createQueryBuilder()
      .update(Post)
      .set({
        viewCount: () => 'view_count + 1',
        // disable mysql updating updated_at column for view_count update
        updatedAt: () => 'updated_at',
      })
      .where('id = :id', { id: post.id })
      .execute();

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

  public async getTop3PostsPerCategoryAndSliderPostsAndOtherPosts(
    currentLang: Language
  ): Promise<CategoryAndSliderPostsResponseDto> {

    // get posts for slider and other
    const sliderPosts = await this.postRepository
      .createQueryBuilder('p')
      .withDeleted()
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
      .andWhere('p.deletedAt IS NULL')
      .orderBy({
        'p.isUpdating': 'DESC',
        'p.sortAt': 'DESC',
      })
      .limit(4)
      .getMany();

    // get other posts not including slider posts
    const otherPosts = sliderPosts.length === 4
      ? await this.postRepository
        .createQueryBuilder('p')
        .withDeleted()
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
        .where('p.id NOT IN (:...ids)', { 
          ids: sliderPosts.map((item) => item.id) 
        })
        .andWhere('p.statusId = :statusId', { statusId: StatusEnum.Published })
        .andWhere('p.deletedAt IS NULL')
        .orderBy({
          'p.isUpdating': 'DESC',
          'p.sortAt': 'DESC',
        })
        .limit(3)
        .getMany()
      : [];

    const top3PostsPerCategoryRankedRows = await this.top3postsRowPerCategory(currentLang.id);

    const rankedPostIds = top3PostsPerCategoryRankedRows
      .map((row) => row.id);

    const top3PostsPerCategory = rankedPostIds.length
      ? await this.postRepository
        .createQueryBuilder('p')
        .withDeleted()
        .innerJoin('p.category', 'c', 'c.langId = :langId', {
          langId: currentLang.id,
        })
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
        .where('p.id IN (:...postIds)', { postIds: rankedPostIds })
        .andWhere('p.statusId = :statusId', {
          statusId: StatusEnum.Published,
        })
        .andWhere('p.deletedAt IS NULL')
        .orderBy({
          'p.isUpdating': 'DESC',
          'p.sortAt': 'DESC',
        })
        .getMany()
      : [];

    // get cover image ids
    const coverImageIds = sliderPosts
      .concat(otherPosts)
      .concat(top3PostsPerCategory)
      .map((post) => post.coverImageId?.toString())
      .filter((id): id is string => !!id)

    const coverImages = await this.getCoverImages(coverImageIds);

    const coverImagesMap = new Map(
      coverImages.map((image) => [image.id, image]),
    );

    return {
      sliderPosts: sliderPosts
        .map((post) => {
          post.coverImage = post.coverImageId
            ? coverImagesMap.get(post.coverImageId) as Upload
            : null;

          return PublicPostMapper.toDto(post, this.filesPublicUrl)
        }),
      otherPosts: otherPosts
        .map((post) => {
          post.coverImage = post.coverImageId
            ? coverImagesMap.get(post.coverImageId) as Upload
            : null;

          return PublicPostMapper.toDto(post, this.filesPublicUrl)
        }),
      top3PostsPerCategory: top3PostsPerCategory
        .reduce(
          (acc: CategoryPostItem[], post: Post) => {
            const el = acc.find((item) => item.categoryId === post.category.id);
            post.coverImage = post.coverImageId
              ? coverImagesMap.get(post.coverImageId) as Upload
              : null;
            const postDto = PublicPostMapper.toDto(post, this.filesPublicUrl);
            if (!el) {
              acc.push({
                categoryId: post.category.id,
                posts: [postDto]
              });
            } else {
              el.posts.push(postDto);
            }
            return acc;
          },
          []
        )
    };
  }

  private async top3postsRowPerCategory(langId: number): Promise<{ id: string, categoryId: number }[]> {
    const rankedPosts = this.postRepository
      .createQueryBuilder('p')
      .withDeleted()
      .innerJoin(
        'p.category',
        'c',
        'c.langId = :langId', {
        langId,
      }
      )
      .select('p.id', 'id')
      .addSelect('p.categoryId', 'categoryId')
      .addSelect('p.sortAt', 'sortAt')
      .addSelect('p.isUpdating', 'isUpdating')
      .addSelect(
        `ROW_NUMBER() OVER (
          PARTITION BY p.category_id
          ORDER BY p.isUpdating DESC, p.sortAt DESC, p.id DESC
        )`,
        'rn',
      )
      .where('p.statusId = :statusId', {
        statusId: StatusEnum.Published
      })
      .andWhere('p.deletedAt IS NULL');

    // get top 3 posts row per category
    return this.postRepository.manager
      .createQueryBuilder()
      .select('ranked_posts.id', 'id')
      .addSelect('ranked_posts.categoryId', 'categoryId')
      .from(`(${rankedPosts.getQuery()})`, 'ranked_posts')
      .where('ranked_posts.rn <= :limit', { limit: 3 })
      .orderBy('ranked_posts.categoryId', 'ASC')
      .addOrderBy('ranked_posts.isUpdating', 'DESC')
      .addOrderBy('ranked_posts.sortAt', 'DESC')
      .addOrderBy('ranked_posts.id', 'DESC')
      .setParameters(rankedPosts.getParameters())
      .getRawMany();
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
      .withDeleted()
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

    if (queryDto.title) {
      qb.andWhere('p.title LIKE :title', { title: `%${queryDto.title}%` })
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
      .andWhere('p.deletedAt IS NULL')
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
