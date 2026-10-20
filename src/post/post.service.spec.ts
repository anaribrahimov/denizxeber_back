import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Brackets, In } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PostService, COVER_IMAGE_MIME_TYPES } from './post.service.js';
import { Post } from './post.entity.js';
import { Category } from '../category/category.entity.js';
import { Upload, UploadType } from '../upload/upload.entity.js';
import { User } from '../users/user.entity.js';
import { ValidationException } from '../common/exceptions/validation.exception.js';
import { PostMapper } from './post.mapper.js';
import { createPaginatedResponse } from '../common/utils/pagination.util.js';

const { statusesMock } = vi.hoisted(() => ({
  statusesMock: [] as Array<{ id: number; name: string }>,
}));

vi.mock('../status/status.cache.js', () => ({
  statuses: statusesMock,
}));

vi.mock('./post.mapper.js', () => ({
  PostMapper: {
    toEntity: vi.fn(),
    toDto: vi.fn(),
  },
}));

vi.mock('../common/utils/pagination.util.js', () => ({
  createPaginatedResponse: vi.fn(),
}));

const FILES_URL = 'https://files.test';

/** Chainable TypeORM query builder mock. */
const createQueryBuilderMock = () => {
  const qb: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of [
    'innerJoin',
    'innerJoinAndSelect',
    'leftJoin',
    'addSelect',
    'select',
    'where',
    'andWhere',
    'orderBy',
    'skip',
    'take',
  ]) {
    qb[method] = vi.fn().mockReturnValue(qb);
  }
  qb.getOne = vi.fn();
  qb.getManyAndCount = vi.fn();
  return qb;
};

/** Returns the ValidationException thrown by a promise (or fails). */
const catchValidation = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (e) {
    expect(e).toBeInstanceOf(ValidationException);
    return e as ValidationException;
  }
  throw new Error('Expected ValidationException to be thrown');
};

describe('PostService', () => {
  let service: PostService;
  let qb: ReturnType<typeof createQueryBuilderMock>;

  const postRepository = {
    createQueryBuilder: vi.fn(),
    save: vi.fn(),
  };
  const categoryRepository = { findOne: vi.fn() };
  const uploadRepository = { findOne: vi.fn(), find: vi.fn() };
  const userRepository = { findOne: vi.fn() };
  const configService = { getOrThrow: vi.fn() };

  const lang = { id: 1, name: 'en' } as any;
  const authUser = { userId: 10, email: 'john@test.com' } as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    statusesMock.length = 0;
    statusesMock.push(
      { id: 1, name: 'draft' },
      { id: 2, name: 'published' },
    );

    qb = createQueryBuilderMock();
    postRepository.createQueryBuilder.mockReturnValue(qb);
    configService.getOrThrow.mockReturnValue(FILES_URL);

    vi.mocked(PostMapper.toDto).mockImplementation(
      (post: any) => ({ mapped: true, id: post.id }) as any,
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: getRepositoryToken(Post), useValue: postRepository },
        { provide: getRepositoryToken(Category), useValue: categoryRepository },
        { provide: getRepositoryToken(Upload), useValue: uploadRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = moduleRef.get(PostService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads app.filesPublicUrl from config on construction', () => {
    expect(configService.getOrThrow).toHaveBeenCalledWith('app.filesPublicUrl');
  });

  // ---------------------------------------------------------------------------
  describe('create', () => {
    const category = { id: 5, name: 'News', slug: 'news' };
    const baseDto = { categoryId: 5, title: 'Title', content: 'Body' } as any;

    beforeEach(() => {
      categoryRepository.findOne.mockResolvedValue(category);
      vi.mocked(PostMapper.toEntity).mockReturnValue({ title: 'Title' } as any);
      postRepository.save.mockImplementation(async (p) => ({ id: 99, ...p }));
    });

    it('looks up category by id and language', async () => {
      await service.create(baseDto, lang, authUser);

      expect(categoryRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, langId: lang.id },
          relations: { language: true },
        }),
      );
    });

    it('throws ValidationException when category is not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await catchValidation(service.create(baseDto, lang, authUser));

      expect(postRepository.save).not.toHaveBeenCalled();
    });

    it('does not query uploads when coverImageId is not provided', async () => {
      await service.create(baseDto, lang, authUser);

      expect(uploadRepository.findOne).not.toHaveBeenCalled();
    });

    it('throws ValidationException when cover image is not found', async () => {
      uploadRepository.findOne.mockResolvedValue(null);

      await catchValidation(
        service.create({ ...baseDto, coverImageId: 7 }, lang, authUser),
      );

      expect(uploadRepository.findOne).toHaveBeenCalledWith({
        where: { id: 7, type: UploadType.PUBLIC },
        relations: { versions: true },
      });
      expect(postRepository.save).not.toHaveBeenCalled();
    });

    it('throws ValidationException when cover image has invalid mime type', async () => {
      uploadRepository.findOne.mockResolvedValue({
        id: 7,
        fileMimeType: 'application/pdf',
      });

      await catchValidation(
        service.create({ ...baseDto, coverImageId: 7 }, lang, authUser),
      );

      expect(postRepository.save).not.toHaveBeenCalled();
    });

    it.each(COVER_IMAGE_MIME_TYPES)('accepts cover image of type %s', async (mime) => {
      uploadRepository.findOne.mockResolvedValue({ id: 7, fileMimeType: mime });

      await expect(
        service.create({ ...baseDto, coverImageId: 7 }, lang, authUser),
      ).resolves.toBeDefined();
    });

    it('collects errors for category and cover image together', async () => {
      categoryRepository.findOne.mockResolvedValue(null);
      uploadRepository.findOne.mockResolvedValue(null);

      await catchValidation(
        service.create({ ...baseDto, coverImageId: 7 }, lang, authUser),
      );

      expect(categoryRepository.findOne).toHaveBeenCalled();
      expect(uploadRepository.findOne).toHaveBeenCalled();
    });

    it('saves the mapped entity and returns mapped dto (no status, no cover)', async () => {
      const result = await service.create(baseDto, lang, authUser);

      expect(PostMapper.toEntity).toHaveBeenCalledWith(baseDto, authUser.userId);
      expect(postRepository.save).toHaveBeenCalledWith({ title: 'Title' });

      const mapped = vi.mocked(PostMapper.toDto).mock.calls[0];
      const post = mapped[0] as any;
      expect(mapped[1]).toBe(FILES_URL);
      expect(post).toMatchObject({
        id: 99,
        isUpdating: false,
        status: null,
        category,
        coverImage: null,
        author: { id: authUser.userId, email: authUser.email },
      });
      expect(result).toEqual({ mapped: true, id: 99 });
    });

    it('attaches status, cover image and isUpdating from dto', async () => {
      const cover = { id: 7, fileMimeType: 'image/png' };
      uploadRepository.findOne.mockResolvedValue(cover);

      await service.create(
        { ...baseDto, coverImageId: 7, statusId: 2, isUpdating: true },
        lang,
        authUser,
      );

      const post = vi.mocked(PostMapper.toDto).mock.calls[0][0] as any;
      expect(post.status).toEqual({ id: 2, name: 'published' });
      expect(post.coverImage).toBe(cover);
      expect(post.isUpdating).toBe(true);
    });

    it('sets status to null when statusId is unknown', async () => {
      await service.create({ ...baseDto, statusId: 999 }, lang, authUser);

      const post = vi.mocked(PostMapper.toDto).mock.calls[0][0] as any;
      expect(post.status).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('builds the query with language and post id filters', async () => {
      qb.getOne.mockResolvedValue({ id: 1 });

      await service.findOne('1', 3);

      expect(postRepository.createQueryBuilder).toHaveBeenCalledWith('p');
      expect(qb.innerJoin).toHaveBeenCalledWith(
        'p.category',
        'c',
        'c.langId = :langId',
        { langId: 3 },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('p.id = :postId', { postId: '1' });
    });

    it('throws NotFoundException when post does not exist', async () => {
      qb.getOne.mockResolvedValue(null);

      await expect(service.findOne('1', 3)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('skips cover image lookup when post has no coverImageId', async () => {
      qb.getOne.mockResolvedValue({ id: 1, coverImageId: null });

      const result = await service.findOne('1', 3);

      expect(uploadRepository.findOne).not.toHaveBeenCalled();
      expect(PostMapper.toDto).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
        FILES_URL,
      );
      expect(result).toEqual({ mapped: true, id: 1 });
    });

    it('loads and attaches the cover image', async () => {
      const cover = { id: 8 };
      qb.getOne.mockResolvedValue({ id: 1, coverImageId: 8 });
      uploadRepository.findOne.mockResolvedValue(cover);

      await service.findOne('1', 3);

      expect(uploadRepository.findOne).toHaveBeenCalledWith({
        where: { id: 8 },
        relations: { versions: true },
      });
      const post = vi.mocked(PostMapper.toDto).mock.calls[0][0] as any;
      expect(post.coverImage).toBe(cover);
    });

    it('sets coverImage to null when upload no longer exists', async () => {
      qb.getOne.mockResolvedValue({ id: 1, coverImageId: 8 });
      uploadRepository.findOne.mockResolvedValue(null);

      await service.findOne('1', 3);

      const post = vi.mocked(PostMapper.toDto).mock.calls[0][0] as any;
      expect(post.coverImage).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  describe('update', () => {
    const langId = 3;
    const authUserId = 10;
    const lastUpdater = { id: authUserId, email: 'a@b.c' };

    const makePost = (overrides: Record<string, unknown> = {}) => ({
      id: 1,
      title: 'old title',
      content: 'old content',
      categoryId: 5,
      coverImageId: null,
      isUpdating: false,
      status: null,
      ...overrides,
    });

    beforeEach(() => {
      userRepository.findOne.mockResolvedValue(lastUpdater);
      postRepository.save.mockResolvedValue(undefined);
    });

    it('throws NotFoundException when post does not exist', async () => {
      qb.getOne.mockResolvedValue(null);

      await expect(
        service.update('1', { title: 'x' } as any, langId, authUserId),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(postRepository.save).not.toHaveBeenCalled();
    });

    it('throws ValidationException when nothing is sent to update', async () => {
      qb.getOne.mockResolvedValue(makePost());

      await catchValidation(service.update('1', {} as any, langId, authUserId));

      expect(postRepository.save).not.toHaveBeenCalled();
    });

    it('updates title, content and status', async () => {
      const post = makePost();
      qb.getOne.mockResolvedValue(post);

      const result = await service.update(
        '1',
        { title: 'new', content: 'body', statusId: 2 } as any,
        langId,
        authUserId,
      );

      expect(post).toMatchObject({
        title: 'new',
        content: 'body',
        status: { id: 2, name: 'published' },
        lastUpdatedById: authUserId,
        lastUpdatedBy: lastUpdater,
      });
      expect(postRepository.save).toHaveBeenCalledWith(post);
      expect(PostMapper.toDto).toHaveBeenCalledWith(post, FILES_URL);
      expect(result).toEqual({ mapped: true, id: 1 });
    });

    it('loads the last updater with limited fields', async () => {
      qb.getOne.mockResolvedValue(makePost());

      await service.update('1', { title: 'x' } as any, langId, authUserId);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: authUserId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });
    });

    describe('category', () => {
      it('does not query category when categoryId is unchanged', async () => {
        qb.getOne.mockResolvedValue(makePost({ categoryId: 5 }));

        await service.update('1', { categoryId: 5, title: 'x' } as any, langId, authUserId);

        expect(categoryRepository.findOne).not.toHaveBeenCalled();
      });

      it('throws ValidationException when new category is not found', async () => {
        qb.getOne.mockResolvedValue(makePost());
        categoryRepository.findOne.mockResolvedValue(null);

        await catchValidation(
          service.update('1', { categoryId: 6 } as any, langId, authUserId),
        );

        expect(categoryRepository.findOne).toHaveBeenCalledWith({
          where: { id: 6, langId },
        });
        expect(postRepository.save).not.toHaveBeenCalled();
      });

      it('changes the category when found', async () => {
        const post = makePost();
        const category = { id: 6, name: 'Sport' };
        qb.getOne.mockResolvedValue(post);
        categoryRepository.findOne.mockResolvedValue(category);

        await service.update('1', { categoryId: 6 } as any, langId, authUserId);

        expect(post).toMatchObject({ categoryId: 6, category });
        expect(postRepository.save).toHaveBeenCalled();
      });
    });

    describe('cover image', () => {
      it('loads the existing cover image of the post', async () => {
        const existing = { id: 8 };
        const post = makePost({ coverImageId: 8 });
        qb.getOne.mockResolvedValue(post);
        uploadRepository.findOne.mockResolvedValue(existing);

        await service.update('1', { title: 'x' } as any, langId, authUserId);

        expect(uploadRepository.findOne).toHaveBeenCalledWith({
          where: { id: 8 },
          relations: { versions: true },
        });
        expect((post as any).coverImage).toBe(existing);
      });

      it('removes the cover image when coverImageId is null', async () => {
        const post = makePost({ coverImageId: 8 });
        qb.getOne.mockResolvedValue(post);
        uploadRepository.findOne.mockResolvedValue({ id: 8 });

        await service.update('1', { coverImageId: null } as any, langId, authUserId);

        expect(post.coverImageId).toBeNull();
        expect((post as any).coverImage).toBeNull();
        expect(postRepository.save).toHaveBeenCalled();
      });

      it('throws ValidationException when new cover image is not found', async () => {
        qb.getOne.mockResolvedValue(makePost());
        uploadRepository.findOne.mockResolvedValue(null);

        await catchValidation(
          service.update('1', { coverImageId: 20 } as any, langId, authUserId),
        );

        expect(postRepository.save).not.toHaveBeenCalled();
      });

      it('sets the new cover image when found', async () => {
        const post = makePost();
        const cover = { id: 20 };
        qb.getOne.mockResolvedValue(post);
        uploadRepository.findOne.mockResolvedValue(cover);

        await service.update('1', { coverImageId: 20 } as any, langId, authUserId);

        expect(uploadRepository.findOne).toHaveBeenLastCalledWith({
          where: { id: 20 },
          relations: { versions: true },
        });
        expect(post.coverImageId).toBe(20);
        expect((post as any).coverImage).toBe(cover);
      });
    });

    it('reports category and cover image errors together', async () => {
      qb.getOne.mockResolvedValue(makePost());
      categoryRepository.findOne.mockResolvedValue(null);
      uploadRepository.findOne.mockResolvedValue(null);

      await catchValidation(
        service.update(
          '1',
          { categoryId: 6, coverImageId: 20 } as any,
          langId,
          authUserId,
        ),
      );
    });

    describe('isUpdating', () => {
      beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-07T10:00:00.000Z'));
      });

      it('sets sortAt when isUpdating switches to true', async () => {
        const post = makePost({ isUpdating: false });
        qb.getOne.mockResolvedValue(post);

        await service.update('1', { isUpdating: true } as any, langId, authUserId);

        expect(post.isUpdating).toBe(true);
        expect((post as any).sortAt).toEqual(new Date('2026-10-07T10:00:00.000Z'));
      });

      it('does not touch sortAt when isUpdating switches to false', async () => {
        const post = makePost({ isUpdating: true });
        qb.getOne.mockResolvedValue(post);

        await service.update('1', { isUpdating: false } as any, langId, authUserId);

        expect(post.isUpdating).toBe(false);
        expect((post as any).sortAt).toBeUndefined();
      });

      it('does not touch sortAt when isUpdating is unchanged', async () => {
        const post = makePost({ isUpdating: true });
        qb.getOne.mockResolvedValue(post);

        await service.update(
          '1',
          { isUpdating: true, title: 'x' } as any,
          langId,
          authUserId,
        );

        expect((post as any).sortAt).toBeUndefined();
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('remove', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-07T10:00:00.000Z'));
    });

    it('throws NotFoundException when post does not exist', async () => {
      qb.getOne.mockResolvedValue(null);

      await expect(service.remove('1', 3, 10)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(postRepository.save).not.toHaveBeenCalled();
    });

    it('filters by language and post id', async () => {
      qb.getOne.mockResolvedValue({ id: 1 });

      await service.remove('1', 3, 10);

      expect(qb.where).toHaveBeenCalledWith('c.langId = :langId', { langId: 3 });
      expect(qb.andWhere).toHaveBeenCalledWith('p.id = :postId', { postId: '1' });
    });

    it('soft deletes the post and records who did it', async () => {
      const post: Record<string, unknown> = { id: 1 };
      qb.getOne.mockResolvedValue(post);

      await expect(service.remove('1', 3, 10)).resolves.toBeUndefined();

      expect(post.lastUpdatedById).toBe(10);
      expect(post.deletedAt).toEqual(new Date('2026-10-07T10:00:00.000Z'));
      expect(postRepository.save).toHaveBeenCalledWith(post);
    });
  });

  // ---------------------------------------------------------------------------
  describe('findPaginated', () => {
    const langId = 3;
    const baseQuery = { page: 2, limit: 10 } as any;

    beforeEach(() => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      uploadRepository.find.mockResolvedValue([]);
      vi.mocked(createPaginatedResponse).mockReturnValue({ paginated: true } as any);
    });

    it('applies pagination and ordering', async () => {
      await service.findPaginated(baseQuery, langId);

      expect(qb.skip).toHaveBeenCalledWith(10);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(qb.orderBy).toHaveBeenCalledWith({
        'p.isUpdating': 'DESC',
        'p.sort_at': 'DESC',
      });
    });

    it('left joins the category by language', async () => {
      await service.findPaginated(baseQuery, langId);

      expect(qb.leftJoin).toHaveBeenCalledWith(
        'p.category',
        'c',
        'c.langId = :langId',
        { langId },
      );
    });

    it('adds no filters when query has only paging params', async () => {
      await service.findPaginated(baseQuery, langId);

      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('applies categoryId, statusId and title filters', async () => {
      await service.findPaginated(
        { ...baseQuery, categoryId: 5, statusId: 2, title: '  hello  ' },
        langId,
      );

      expect(qb.andWhere).toHaveBeenCalledWith('p.categoryId = :categoryId', {
        categoryId: 5,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('p.statusId = :statusId', {
        statusId: 2,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('p.title LIKE :title', {
        title: '%hello%',
      });
    });

    it('ignores blank title and user filters', async () => {
      await service.findPaginated({ ...baseQuery, title: '   ', user: '  ' }, langId);

      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('applies user filter across email, first name and last name', async () => {
      await service.findPaginated({ ...baseQuery, user: ' john ' }, langId);

      expect(qb.andWhere).toHaveBeenCalledWith(expect.any(Brackets), {
        user: '%john%',
      });

      // execute the Brackets factory against a fake sub query builder
      const brackets = qb.andWhere.mock.calls[0][0] as Brackets;
      const subQb = {
        where: vi.fn().mockReturnThis(),
        orWhere: vi.fn().mockReturnThis(),
      };
      brackets.whereFactory(subQb as any);

      expect(subQb.where).toHaveBeenCalledWith('a.email LIKE :user');
      expect(subQb.orWhere).toHaveBeenCalledWith('a.firstName LIKE :user');
      expect(subQb.orWhere).toHaveBeenCalledWith('a.lastName LIKE :user');
    });

    it('does not query uploads when no post has a cover image', async () => {
      qb.getManyAndCount.mockResolvedValue([
        [{ id: 1, coverImageId: null, statusId: null }],
        1,
      ]);

      await service.findPaginated(baseQuery, langId);

      expect(uploadRepository.find).not.toHaveBeenCalled();
    });

    it('batch loads cover images and maps cover images and statuses onto posts', async () => {
      const cover1 = { id: 100 };
      const cover2 = { id: 200 };
      const posts = [
        { id: 1, coverImageId: 100, statusId: 1 },
        { id: 2, coverImageId: 200, statusId: 2 },
        { id: 3, coverImageId: null, statusId: null },
        { id: 4, coverImageId: null, statusId: 999 },
      ];
      qb.getManyAndCount.mockResolvedValue([posts, 4]);
      uploadRepository.find.mockResolvedValue([cover1, cover2]);

      const result = await service.findPaginated(baseQuery, langId);

      expect(uploadRepository.find).toHaveBeenCalledTimes(1);
      expect(uploadRepository.find).toHaveBeenCalledWith({
        where: { id: In([100, 200]) },
        relations: { versions: true },
      });

      expect(posts[0]).toMatchObject({
        coverImage: cover1,
        status: { id: 1, name: 'draft' },
      });
      expect(posts[1]).toMatchObject({
        coverImage: cover2,
        status: { id: 2, name: 'published' },
      });
      expect(posts[2]).toMatchObject({ coverImage: null, status: null });
      expect(posts[3]).toMatchObject({ coverImage: null, status: null });

      expect(PostMapper.toDto).toHaveBeenCalledTimes(4);
      expect(PostMapper.toDto).toHaveBeenCalledWith(posts[0], FILES_URL);

      expect(createPaginatedResponse).toHaveBeenCalledWith(
        [
          { mapped: true, id: 1 },
          { mapped: true, id: 2 },
          { mapped: true, id: 3 },
          { mapped: true, id: 4 },
        ],
        4,
        2,
        10,
      );
      expect(result).toEqual({ paginated: true });
    });
  });
});
