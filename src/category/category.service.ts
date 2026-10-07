import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Category } from './category.entity.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { ValidationException } from '../common/exceptions/validation.exception.js';
import { CategoryMapper } from './category.mapper.js';
import { CategoryResponseDto } from './dto/category-response.dto.js';
import { Language } from '../language/language.entity.js';
import slug from 'slug';
import { Post } from '../post/post.entity.js';

@Injectable()
export class CategoryService {

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    private readonly dataSource: DataSource,
    
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) { }

  async create(
    dto: CreateCategoryDto,
    userId: number,
    language: Language,
  ): Promise<CategoryResponseDto> {
    const existing = await this.categoryRepository.findOne({
      where: {
        langId: language.id,
        name: dto.name,
      },
      withDeleted: true
    });

    if (existing) {
      throw new ValidationException(
        { 'name': ['Name already in use'] }
      )
    }

    const category = CategoryMapper.toEntity(dto, userId, language.id);

    const savedCategory = await this.categoryRepository.save(category);
    savedCategory.language = language;

    return CategoryMapper.toReponse(savedCategory);
  }

  async findAll(langId: number): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      where: {
        langId,
      },
      order: {
        createdAt: 'DESC',
      },
      // relations: {
      //   language: true,
      // }
    });

    return categories.map((item: Category) => CategoryMapper.toReponse(item));
  }

  async findOne(id: number, langId: number): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id, langId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return CategoryMapper.toReponse(category);
  }

  async update(
    id: number,
    dto: UpdateCategoryDto,
    langId: number
  ): Promise<CategoryResponseDto> {

    if (dto.name && dto.changePostsCategoryId) {
      throw new ValidationException(
        {
          'changePostsCategoryId': [
            'Can not be sent alongside name'
          ],
        }
      )
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // find category
      const category = await queryRunner.manager.findOne(Category, {
        where: { id, langId },
        lock: {
          mode: 'pessimistic_write'
        },
        relations: {
          language: true
        }
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (dto.changePostsCategoryId) {
        const toCategory = await queryRunner.manager.findOne(Category, {
          where: { id: dto.changePostsCategoryId, langId: category.langId },
        });

        if (!toCategory) {
          throw new ValidationException(
            { 'changePostsCategoryId': ['Category not found'] }
          )
        }

        // change category of the posts of the category
        await queryRunner.manager
          .createQueryBuilder()
          .update(Post)
          .set({
            categoryId: dto.changePostsCategoryId,
          })
          .where('categoryId = :id', { id })
          .execute();
      }

      if (dto.name && dto.name !== category.name) {
        const existing = await queryRunner.manager
          .findOne(Category, {
            where: {
              langId: category.langId,
              name: dto.name,
            },
            withDeleted: true,
          });

        if (existing && existing.id !== id) {
          throw new ValidationException(
            {
              'name': [
                'Category with this name already exists for this language'
              ],
            }
          )
        }

        // update category name
        category.name = dto.name;

        // update category slug
        category.slug = slug(dto.name) + `-${Date.now()}`;
      }

      // if (typeof dto.isActive === 'boolean') {
      //   category.isActive = dto.isActive;
      // }

      await queryRunner.manager.save(category); // save user

      await queryRunner.commitTransaction(); // commit transaction

      return CategoryMapper.toReponse(category);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number, langId: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id, langId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const hasPost = await this.postRepository
      .exists({
        where: { categoryId: id },
        withDeleted: true
      });

    if (hasPost) {
      throw new ConflictException('Category having posts forbidden to delete');
    }

    await this.categoryRepository.softDelete(id);
  }
}
