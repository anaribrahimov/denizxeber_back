import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { CategoryService } from './category.service.js';
import { Category } from './category.entity.js';
import { ValidationException } from '../common/exceptions/validation.exception.js';
import { CategoryMapper } from './category.mapper.js';
import { Language } from '../language/language.entity.js';
import slug from 'slug';

// ---- Mock external modules ----
vi.mock('./category.mapper.js', () => ({
  CategoryMapper: {
    toEntity: vi.fn(),
    toReponse: vi.fn(),
  },
}));

vi.mock('slug', () => ({
  default: vi.fn(),
}));

describe('CategoryService', () => {
  let service: CategoryService;

  // Repository mock
  let categoryRepository: {
    findOne: Mock;
    find: Mock;
    save: Mock;
    remove: Mock;
  };

  // QueryRunner mock used inside DataSource.createQueryRunner()
  let queryRunner: {
    connect: Mock;
    startTransaction: Mock;
    commitTransaction: Mock;
    rollbackTransaction: Mock;
    release: Mock;
    manager: {
      findOne: Mock;
      save: Mock;
    };
  };

  let dataSource: {
    createQueryRunner: Mock;
  };

  const language: Language = { id: 1, name: 'en' } as Language;

  beforeEach(() => {
    vi.clearAllMocks();

    categoryRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
    };

    queryRunner = {
      connect: vi.fn(),
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      rollbackTransaction: vi.fn(),
      release: vi.fn(),
      manager: {
        findOne: vi.fn(),
        save: vi.fn(),
      },
    };

    dataSource = {
      createQueryRunner: vi.fn().mockReturnValue(queryRunner),
    };

    service = new CategoryService(
      categoryRepository as unknown as Repository<Category>,
      dataSource as unknown as DataSource,
    );
  });

  // ---------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------
  describe('create', () => {
    const dto = { name: 'Tech' } as any;
    const userId = 10;

    it('throws ValidationException when a category with the same name already exists for the language', async () => {
      categoryRepository.findOne.mockResolvedValue({ id: 1, name: 'Tech' });

      await expect(service.create(dto, userId, language)).rejects.toThrow(
        ValidationException,
      );

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { langId: language.id, name: dto.name },
      });
      expect(categoryRepository.save).not.toHaveBeenCalled();
    });

    it('creates and returns a mapped category when name is not taken', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      const entity = { id: 5, name: 'Tech', langId: language.id } as Category;
      const savedEntity = { ...entity } as Category;

      (CategoryMapper.toEntity as Mock).mockReturnValue(entity);
      categoryRepository.save.mockResolvedValue(savedEntity);
      (CategoryMapper.toReponse as Mock).mockReturnValue({
        id: 5,
        name: 'Tech',
      });

      const result = await service.create(dto, userId, language);

      expect(CategoryMapper.toEntity).toHaveBeenCalledWith(
        dto,
        userId,
        language.id,
      );
      expect(categoryRepository.save).toHaveBeenCalledWith(entity);
      expect(savedEntity.language).toBe(language);
      expect(CategoryMapper.toReponse).toHaveBeenCalledWith(savedEntity);
      expect(result).toEqual({ id: 5, name: 'Tech' });
    });
  });

  // ---------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------
  describe('findAll', () => {
    it('returns mapped categories ordered by createdAt desc', async () => {
      const categories = [{ id: 1 }, { id: 2 }] as Category[];
      categoryRepository.find.mockResolvedValue(categories);
      (CategoryMapper.toReponse as Mock).mockImplementation((c: any) => ({
        id: c.id,
      }));

      const result = await service.findAll(1);

      expect(categoryRepository.find).toHaveBeenCalledWith({
        where: { langId: 1 },
        order: { createdAt: 'DESC' },
      });
      expect(CategoryMapper.toReponse).toHaveBeenCalledTimes(2);
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('returns an empty array when there are no categories', async () => {
      categoryRepository.find.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toEqual([]);
      expect(CategoryMapper.toReponse).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------
  describe('findOne', () => {
    it('throws NotFoundException when category does not exist', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, 1)).rejects.toThrow(NotFoundException);
      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, langId: 1 },
      });
    });

    it('returns mapped category when found', async () => {
      const category = { id: 1, name: 'Tech' } as Category;
      categoryRepository.findOne.mockResolvedValue(category);
      (CategoryMapper.toReponse as Mock).mockReturnValue({
        id: 1,
        name: 'Tech',
      });

      const result = await service.findOne(1, 1);

      expect(CategoryMapper.toReponse).toHaveBeenCalledWith(category);
      expect(result).toEqual({ id: 1, name: 'Tech' });
    });
  });

  // ---------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------
  describe('update', () => {
    it('throws ValidationException when both name and changePostsCategoryId are provided, without starting a transaction', async () => {
      const dto = { name: 'New', changePostsCategoryId: 2 } as any;

      await expect(service.update(1, dto, 1)).rejects.toThrow(
        ValidationException,
      );
      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('throws NotFoundException and rolls back when category is not found', async () => {
      queryRunner.manager.findOne.mockResolvedValue(null);

      await expect(
        service.update(1, { name: 'New' } as any, 1),
      ).rejects.toThrow(NotFoundException);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('throws ValidationException and rolls back when changePostsCategoryId target category is not found', async () => {
      const dto = { changePostsCategoryId: 99 } as any;
      const category = { id: 1, langId: 1, name: 'Tech' } as Category;

      queryRunner.manager.findOne
        .mockResolvedValueOnce(category) // main category lookup
        .mockResolvedValueOnce(null); // target category lookup

      await expect(service.update(1, dto, 1)).rejects.toThrow(
        ValidationException,
      );

      expect(queryRunner.manager.findOne).toHaveBeenCalledTimes(2);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('throws ValidationException and rolls back when new name is already used by another category', async () => {
      const dto = { name: 'Existing' } as any;
      const category = { id: 1, langId: 1, name: 'Tech' } as Category;
      const conflicting = { id: 2, langId: 1, name: 'Existing' } as Category;

      queryRunner.manager.findOne.mockResolvedValueOnce(category);
      categoryRepository.findOne.mockResolvedValue(conflicting);

      await expect(service.update(1, dto, 1)).rejects.toThrow(
        ValidationException,
      );

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { langId: category.langId, name: dto.name },
      });
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('allows renaming when the "existing" match with the same name is the category itself', async () => {
      const dto = { name: 'Tech Updated' } as any;
      const category = { id: 1, langId: 1, name: 'Tech' } as Category;

      queryRunner.manager.findOne.mockResolvedValueOnce(category);
      // existing found but it's the same record (id matches) -> allowed
      categoryRepository.findOne.mockResolvedValue({ id: 1, name: 'Tech' });
      (slug as unknown as Mock).mockReturnValue('tech-updated');
      queryRunner.manager.save.mockResolvedValue(category);
      (CategoryMapper.toReponse as Mock).mockReturnValue({ id: 1 });

      const result = await service.update(1, dto, 1);

      expect(category.name).toBe('Tech Updated');
      expect(category.slug).toBe('tech-updated');
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual({ id: 1 });
    });

    it('updates name and slug when name changes and no conflict exists', async () => {
      const dto = { name: 'New Name' } as any;
      const category = { id: 1, langId: 1, name: 'Old Name' } as Category;

      queryRunner.manager.findOne.mockResolvedValueOnce(category);
      categoryRepository.findOne.mockResolvedValue(null);
      (slug as unknown as Mock).mockReturnValue('new-name');
      queryRunner.manager.save.mockResolvedValue(category);
      (CategoryMapper.toReponse as Mock).mockReturnValue({
        id: 1,
        name: 'New Name',
      });

      const result = await service.update(1, dto, 1);

      expect(slug).toHaveBeenCalledWith('New Name');
      expect(category.name).toBe('New Name');
      expect(category.slug).toBe('new-name');
      expect(queryRunner.manager.save).toHaveBeenCalledWith(category);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, name: 'New Name' });
    });

    it('does not touch name/slug when dto.name equals the current name', async () => {
      const dto = { name: 'Same Name' } as any;
      const category = { id: 1, langId: 1, name: 'Same Name', slug: 'same-name' } as Category;

      queryRunner.manager.findOne.mockResolvedValueOnce(category);
      queryRunner.manager.save.mockResolvedValue(category);
      (CategoryMapper.toReponse as Mock).mockReturnValue({ id: 1 });

      await service.update(1, dto, 1);

      expect(categoryRepository.findOne).not.toHaveBeenCalled();
      expect(slug).not.toHaveBeenCalled();
      expect(category.slug).toBe('same-name');
    });

    it('updates isActive flag when provided as boolean', async () => {
      const dto = { isActive: false } as any;
      const category = { id: 1, langId: 1, name: 'Tech', isActive: true } as Category;

      queryRunner.manager.findOne.mockResolvedValueOnce(category);
      queryRunner.manager.save.mockResolvedValue(category);
      (CategoryMapper.toReponse as Mock).mockReturnValue({ id: 1 });

      await service.update(1, dto, 1);

      expect(category.isActive).toBe(false);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('releases the query runner even when an unexpected error occurs', async () => {
      queryRunner.manager.findOne.mockRejectedValue(new Error('DB down'));

      await expect(
        service.update(1, { name: 'X' } as any, 1),
      ).rejects.toThrow('DB down');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------
  describe('remove', () => {
    it('throws NotFoundException when category does not exist', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 1)).rejects.toThrow(NotFoundException);
      expect(categoryRepository.remove).not.toHaveBeenCalled();
    });

    it('removes the category when found', async () => {
      const category = { id: 1, name: 'Tech' } as Category;
      categoryRepository.findOne.mockResolvedValue(category);

      await service.remove(1, 1);

      expect(categoryRepository.remove).toHaveBeenCalledWith(category);
    });
  });
});