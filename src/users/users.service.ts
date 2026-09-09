import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { User } from './user.entity.js';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../roles/role.entity.js';
import { ValidationException } from '../common/exceptions/validation.exception.js';
import { Language } from '../language/language.entity.js';
import { UserMapper } from './user.mapper.js';
import { UserResponseDTO } from './dto/user-response.dto.js';
import { UploadMapper } from '../uploads/uploads.mapper.js';
import { storageConfig } from '../config/storage.config.js';
import type { ConfigType } from '@nestjs/config';
import { Upload } from '../uploads/upload.entity.js';
import { deleteFile } from '../common/utils/storage.util.js';
import { UpdateUserDTO } from './dto/update-user.dto.js';
import { hashPassword } from '../common/utils/auth.util.js';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {

  constructor(
    @Inject(storageConfig.KEY)
    private readonly storage: ConfigType<typeof storageConfig>,

    private readonly dataSource: DataSource,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  async create(dto: CreateUserDto, profileImage: Express.Multer.File): Promise<UserResponseDTO> {
    const errors: Record<string, string[]> = {};

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // find user
      const user = await queryRunner.manager.existsBy(User, { email: dto.email });

      // console.log(user);

      if (user) errors['email'] = ['Email is already in use'];

      const role = await queryRunner.manager.findOneBy(Role, { id: dto.roleId });

      // console.log('role', role);

      if (!role) errors['role_id'] = ['Role not found'];

      const languages = await queryRunner.manager.find(Language);

      // console.log(languages, dto.langIds);

      const langErrors = dto.langIds
        .reduce((accumulator: string[], langId) => {
          if (!languages.find((item) => item.id === langId)) {
            accumulator.push('Language not found with id: ' + langId);
          }
          return accumulator;
        }, []);

      if (langErrors.length) errors['lang_ids'] = langErrors;

      if (Object.keys(errors).length) throw new ValidationException(errors);

      let savedUpload: Upload | null = null;

      if (profileImage) {
        const upload = UploadMapper.toEntity(profileImage, this.storage.localUplodsPath!, true);
        // save upload to db
        savedUpload = await queryRunner.manager.save(Upload, upload);
      }

      const newUser = await UserMapper.toEntity(dto, role!, savedUpload);

      // console.log(newUser);

      // save user
      const savedUser = await queryRunner.manager.save(User, newUser);

      // console.log('saved user', savedUser);

      await queryRunner.commitTransaction(); // commit transaction

      return UserMapper.toResponseDTO(savedUser, languages);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await deleteFile(profileImage.path);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateUserDTO, profileImage?: Express.Multer.File): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // find the user and lock the row for update
      const user: User | null = await queryRunner.manager.findOne(User, {
        where: {
          id: id,
        },
        lock: {
          mode: 'pessimistic_write'
        }
      });

      if (!user) throw new NotFoundException('User not found: ' + id);

      const errors: Record<string, string[]> = {};

      if (dto.firstName && dto.firstName != user.firstName) user.firstName = dto.firstName;
      if (dto.lastName && dto.lastName != user.lastName) user.lastName = dto.lastName;
      if (typeof dto.isActive === 'boolean') user.isActive = dto.isActive;

      if (dto.langIds && dto.langIds.length) {
        // get languages
        const languages = await queryRunner.manager.find(Language);

        const langErrors = dto.langIds
          .reduce((accumulator: string[], langId: number) => {
            if (!languages.find((item) => item.id === langId)) {
              accumulator.push('Language not found with id: ' + langId);
            }
            return accumulator;
          }, []);

        if (langErrors.length) errors['lang_ids'] = langErrors;
        else user.langIds = dto.langIds;
      }

      if (dto.roleId && dto.roleId !== user.roleId) {
        const role = await queryRunner.manager.findOneBy(Role, { id: dto.roleId });
        if (!role) errors['role_id'] = ['Role not found'];
        else user.role = role;
      }

      if (Object.keys(errors).length) throw new ValidationException(errors);

      if (profileImage || dto.removeProfileImage) {
        if (user.profileImageId) {
          // remove current upload record
          await queryRunner.manager.softDelete(Upload, user.profileImageId);
          user.profileImage = null;
          user.profileImageId = null;
        }

        if (profileImage) {
          const upload = UploadMapper.toEntity(profileImage, this.storage.localUplodsPath!, true);
          // save upload to db
          const savedUpload = await queryRunner.manager.save(Upload, upload);
          user.profileImage = savedUpload;
        }
      }

      if (dto.password) {
        user.password = await hashPassword(dto.password);
      }

      // save user
      await queryRunner.manager.save(user);

      await queryRunner.commitTransaction(); // commit transaction

    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (profileImage) await deleteFile(profileImage.path);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // find the user and lock the row for update
      const user: User | null = await queryRunner.manager.findOne(User, {
        where: {
          id: id,
        },
        lock: {
          mode: 'pessimistic_write'
        }
      });

      if (!user) throw new NotFoundException('User not found: ' + id);

      await queryRunner.manager.softDelete(User, id);

      await queryRunner.commitTransaction(); // commit transaction
      
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async find(id: number): Promise<UserResponseDTO> {
    // find user
    const user = await this.usersRepository
      .findOne({
        relations: { role: true },
        where: { id },
      });

    if (!user) throw new NotFoundException('User was not found: ' + id);

    const languages: Language[] = await this.languageRepository.find();

    return UserMapper.toResponseDTO(user, languages);
  }  
}
