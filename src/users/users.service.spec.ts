import { describe, it, expect, beforeEach, vi, type Mock, type Mocked } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { UsersService } from './users.service.js';
import { User } from './user.entity.js';
import { Role } from '../roles/role.entity.js';
import { Language } from '../language/language.entity.js';
import { Upload } from '../uploads/upload.entity.js';
import { UserMapper } from './user.mapper.js';
import { UploadMapper } from '../uploads/uploads.mapper.js';
import { ValidationException } from '../common/exceptions/validation.exception.js';
import { deleteFile } from '../common/utils/storage.util.js';
import { hashPassword } from '../common/utils/auth.util.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDTO } from './dto/update-user.dto.js';
import { PaginateUserDto } from './dto/paginate-user.dto.js';

// ---- Mock external collaborators ----
vi.mock('./user.mapper.js', () => ({
  UserMapper: {
    toEntity: vi.fn(),
    toResponseDTO: vi.fn(),
  },
}));

vi.mock('../uploads/uploads.mapper.js', () => ({
  UploadMapper: {
    toEntity: vi.fn(),
  },
}));

vi.mock('../common/utils/storage.util.js', () => ({
  deleteFile: vi.fn(),
}));

vi.mock('../common/utils/auth.util.js', () => ({
  hashPassword: vi.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  // query runner + manager mocks used across create/update/delete
  let manager: {
    existsBy: Mock;
    findOneBy: Mock;
    find: Mock;
    findOne: Mock;
    save: Mock;
    softDelete: Mock;
  };
  let queryRunner: {
    connect: Mock;
    startTransaction: Mock;
    commitTransaction: Mock;
    rollbackTransaction: Mock;
    release: Mock;
    manager: typeof manager;
  };
  let dataSource: { createQueryRunner: Mock };

  let usersRepository: Mocked<Partial<Repository<User>>>;
  let roleRepository: Mocked<Partial<Repository<Role>>>;
  let languageRepository: Mocked<Partial<Repository<Language>>>;

  const storage = { localUplodsPath: '/uploads' };

  beforeEach(() => {
    vi.clearAllMocks();

    manager = {
      existsBy: vi.fn(),
      findOneBy: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
      softDelete: vi.fn(),
    };

    queryRunner = {
      connect: vi.fn(),
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      rollbackTransaction: vi.fn(),
      release: vi.fn(),
      manager,
    };

    dataSource = {
      createQueryRunner: vi.fn().mockReturnValue(queryRunner),
    };

    usersRepository = {
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    roleRepository = {};

    languageRepository = {
      find: vi.fn(),
    };

    service = new UsersService(
      storage as any,
      dataSource as unknown as DataSource,
      usersRepository as unknown as Repository<User>,
      roleRepository as unknown as Repository<Role>,
      languageRepository as unknown as Repository<Language>,
    );
  });

  // ---------------------------------------------------------------
  // create()
  // ---------------------------------------------------------------
  describe('create', () => {
    const dto = {
      email: 'test@example.com',
      roleId: 1,
      langIds: [1, 2],
    } as unknown as CreateUserDto;

    const role = { id: 1, name: 'Admin' } as Role;
    const languages = [{ id: 1 }, { id: 2 }] as Language[];

    it('creates a user successfully without a profile image', async () => {
      manager.existsBy.mockResolvedValue(false);
      manager.findOneBy.mockResolvedValue(role);
      manager.find.mockResolvedValue(languages);

      const newUserEntity = { id: 10 } as User;
      const savedUser = { id: 10 } as User;
      const responseDto = { id: 10 } as any;

      (UserMapper.toEntity as Mock).mockResolvedValue(newUserEntity);
      manager.save.mockResolvedValue(savedUser);
      (UserMapper.toResponseDTO as Mock).mockReturnValue(responseDto);

      const result = await service.create(dto, undefined as any);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(manager.existsBy).toHaveBeenCalledWith(User, { email: dto.email });
      expect(manager.findOneBy).toHaveBeenCalledWith(Role, { id: dto.roleId });
      expect(manager.find).toHaveBeenCalledWith(Language);
      expect(UploadMapper.toEntity).not.toHaveBeenCalled();
      expect(UserMapper.toEntity).toHaveBeenCalledWith(dto, role, null);
      expect(manager.save).toHaveBeenCalledWith(User, newUserEntity);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(UserMapper.toResponseDTO).toHaveBeenCalledWith(savedUser, languages);
      expect(result).toBe(responseDto);
    });

    it('creates a user with a profile image, saving the upload first', async () => {
      manager.existsBy.mockResolvedValue(false);
      manager.findOneBy.mockResolvedValue(role);
      manager.find.mockResolvedValue(languages);

      const profileImage = { path: '/tmp/img.png' } as Express.Multer.File;
      const uploadEntity = { filename: 'img.png' } as unknown as Upload;
      const savedUpload = { id: 5, filename: 'img.png' } as unknown as Upload;
      const newUserEntity = { id: 10 } as User;
      const savedUser = { id: 10 } as User;
      const responseDto = { id: 10 } as any;

      (UploadMapper.toEntity as Mock).mockReturnValue(uploadEntity);
      manager.save
        .mockResolvedValueOnce(savedUpload) // save(Upload, upload)
        .mockResolvedValueOnce(savedUser); // save(User, newUser)
      (UserMapper.toEntity as Mock).mockResolvedValue(newUserEntity);
      (UserMapper.toResponseDTO as Mock).mockReturnValue(responseDto);

      const result = await service.create(dto, profileImage);

      expect(UploadMapper.toEntity).toHaveBeenCalledWith(profileImage, storage.localUplodsPath, true);
      expect(manager.save).toHaveBeenNthCalledWith(1, Upload, uploadEntity);
      expect(UserMapper.toEntity).toHaveBeenCalledWith(dto, role, savedUpload);
      expect(manager.save).toHaveBeenNthCalledWith(2, User, newUserEntity);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toBe(responseDto);
    });

    it('rolls back and throws ValidationException when email already in use', async () => {
      manager.existsBy.mockResolvedValue(true);
      manager.findOneBy.mockResolvedValue(role);
      manager.find.mockResolvedValue(languages);

      const profileImage = { path: '/tmp/img.png' } as Express.Multer.File;

      await expect(service.create(dto, profileImage)).rejects.toThrow(ValidationException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(deleteFile).toHaveBeenCalledWith(profileImage.path);
      expect(queryRunner.release).toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('rolls back and throws ValidationException when role is not found', async () => {
      manager.existsBy.mockResolvedValue(false);
      manager.findOneBy.mockResolvedValue(null);
      manager.find.mockResolvedValue(languages);

      const profileImage = { path: '/tmp/img.png' } as Express.Multer.File;

      await expect(service.create(dto, profileImage)).rejects.toThrow(ValidationException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(deleteFile).toHaveBeenCalledWith(profileImage.path);
    });

    it('rolls back and throws ValidationException when a language id is invalid', async () => {
      manager.existsBy.mockResolvedValue(false);
      manager.findOneBy.mockResolvedValue(role);
      manager.find.mockResolvedValue([{ id: 1 }]); // langIds includes 2, which is missing

      const profileImage = { path: '/tmp/img.png' } as Express.Multer.File;

      await expect(service.create(dto, profileImage)).rejects.toThrow(ValidationException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(deleteFile).toHaveBeenCalledWith(profileImage.path);
    });

    it('rolls back, deletes the temp file, and rethrows on unexpected save error', async () => {
      manager.existsBy.mockResolvedValue(false);
      manager.findOneBy.mockResolvedValue(role);
      manager.find.mockResolvedValue(languages);
      (UserMapper.toEntity as Mock).mockResolvedValue({} as User);

      const error = new Error('DB is down');
      manager.save.mockRejectedValue(error);

      const profileImage = { path: '/tmp/img.png' } as Express.Multer.File;

      await expect(service.create(dto, profileImage)).rejects.toThrow(error);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(deleteFile).toHaveBeenCalledWith(profileImage.path);
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // update()
  // ---------------------------------------------------------------
  describe('update', () => {
    const baseUser = () =>
      ({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        langIds: [1],
        roleId: 1,
        profileImageId: null,
        profileImage: null,
        password: 'old-hash',
      }) as User;

    it('throws NotFoundException when the user does not exist', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(service.update(1, {} as UpdateUserDTO)).rejects.toThrow(NotFoundException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(deleteFile).not.toHaveBeenCalled();
    });

    it('updates basic fields and saves', async () => {
      const user = baseUser();
      manager.findOne.mockResolvedValue(user);

      const dto = { firstName: 'Jane', lastName: 'Smith', isActive: false } as UpdateUserDTO;

      await service.update(1, dto);

      expect(user.firstName).toBe('Jane');
      expect(user.lastName).toBe('Smith');
      expect(user.isActive).toBe(false);
      expect(manager.save).toHaveBeenCalledWith(user);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('updates langIds when all provided ids are valid', async () => {
      const user = baseUser();
      manager.findOne.mockResolvedValue(user);
      manager.find.mockResolvedValue([{ id: 1 }, { id: 2 }] as Language[]);

      const dto = { langIds: [1, 2] } as UpdateUserDTO;

      await service.update(1, dto);

      expect(user.langIds).toEqual([1, 2]);
      expect(manager.save).toHaveBeenCalledWith(user);
    });

    it('throws ValidationException and rolls back when a langId is invalid', async () => {
      const user = baseUser();
      manager.findOne.mockResolvedValue(user);
      manager.find.mockResolvedValue([{ id: 1 }] as Language[]);

      const dto = { langIds: [1, 99] } as UpdateUserDTO;

      await expect(service.update(1, dto)).rejects.toThrow(ValidationException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('updates the role when a different, valid roleId is provided', async () => {
      const user = baseUser();
      manager.findOne.mockResolvedValue(user);
      const newRole = { id: 2, name: 'Manager' } as Role;
      manager.findOneBy.mockResolvedValue(newRole);

      const dto = { roleId: 2 } as UpdateUserDTO;

      await service.update(1, dto);

      expect(manager.findOneBy).toHaveBeenCalledWith(Role, { id: 2 });
      expect(user.role).toBe(newRole);
      expect(manager.save).toHaveBeenCalledWith(user);
    });

    it('throws ValidationException when the new role is not found', async () => {
      const user = baseUser();
      manager.findOne.mockResolvedValue(user);
      manager.findOneBy.mockResolvedValue(null);

      const dto = { roleId: 999 } as UpdateUserDTO;

      await expect(service.update(1, dto)).rejects.toThrow(ValidationException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('does not touch the role when roleId matches the current role', async () => {
      const user = baseUser();
      manager.findOne.mockResolvedValue(user);

      const dto = { roleId: user.roleId } as UpdateUserDTO;

      await service.update(1, dto);

      expect(manager.findOneBy).not.toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalledWith(user);
    });

    it('replaces an existing profile image with a new one', async () => {
      const user = { ...baseUser(), profileImageId: 7, profileImage: { id: 7 } as unknown as Upload };
      manager.findOne.mockResolvedValue(user);

      const profileImage = { path: '/tmp/new.png' } as Express.Multer.File;
      const uploadEntity = { filename: 'new.png' } as unknown as Upload;
      const savedUpload = { id: 8, filename: 'new.png' } as unknown as Upload;

      (UploadMapper.toEntity as Mock).mockReturnValue(uploadEntity);
      manager.save.mockResolvedValue(savedUpload);

      await service.update(1, {} as UpdateUserDTO, profileImage);

      expect(manager.softDelete).toHaveBeenCalledWith(Upload, 7);
      expect(UploadMapper.toEntity).toHaveBeenCalledWith(profileImage, storage.localUplodsPath, true);
      expect(user.profileImage).toBe(savedUpload);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('removes the profile image when removeProfileImage is set without a new file', async () => {
      const user = { ...baseUser(), profileImageId: 7, profileImage: { id: 7 } as unknown as Upload };
      manager.findOne.mockResolvedValue(user);

      await service.update(1, { removeProfileImage: true } as UpdateUserDTO);

      expect(manager.softDelete).toHaveBeenCalledWith(Upload, 7);
      expect(user.profileImage).toBeNull();
      expect(user.profileImageId).toBeNull();
      expect(UploadMapper.toEntity).not.toHaveBeenCalled();
    });

    it('hashes and sets the password when provided', async () => {
      const user = baseUser();
      manager.findOne.mockResolvedValue(user);
      (hashPassword as Mock).mockResolvedValue('new-hash');

      await service.update(1, { password: 'plain-text' } as UpdateUserDTO);

      expect(hashPassword).toHaveBeenCalledWith('plain-text');
      expect(user.password).toBe('new-hash');
      expect(manager.save).toHaveBeenCalledWith(user);
    });

    it('rolls back, deletes the uploaded file, and rethrows on save failure', async () => {
      const user = baseUser();
      manager.findOne.mockResolvedValue(user);
      const error = new Error('DB write failed');
      manager.save.mockRejectedValue(error);

      const profileImage = { path: '/tmp/new.png' } as Express.Multer.File;

      await expect(service.update(1, {} as UpdateUserDTO, profileImage)).rejects.toThrow(error);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(deleteFile).toHaveBeenCalledWith(profileImage.path);
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // delete()
  // ---------------------------------------------------------------
  describe('delete', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(service.delete(1)).rejects.toThrow(NotFoundException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(manager.softDelete).not.toHaveBeenCalled();
    });

    it('soft-deletes the user and commits the transaction', async () => {
      manager.findOne.mockResolvedValue({ id: 1 } as User);

      await service.delete(1);

      expect(manager.softDelete).toHaveBeenCalledWith(User, 1);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('rolls back and rethrows when softDelete fails', async () => {
      manager.findOne.mockResolvedValue({ id: 1 } as User);
      const error = new Error('DB error');
      manager.softDelete.mockRejectedValue(error);

      await expect(service.delete(1)).rejects.toThrow(error);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // find()
  // ---------------------------------------------------------------
  describe('find', () => {
    it('returns the mapped user when found', async () => {
      const user = { id: 1 } as User;
      const languages = [{ id: 1 }] as Language[];
      const responseDto = { id: 1 } as any;

      (usersRepository.findOne as Mock).mockResolvedValue(user);
      (languageRepository.find as Mock).mockResolvedValue(languages);
      (UserMapper.toResponseDTO as Mock).mockReturnValue(responseDto);

      const result = await service.find(1);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        relations: { role: true },
        where: { id: 1 },
      });
      expect(UserMapper.toResponseDTO).toHaveBeenCalledWith(user, languages);
      expect(result).toBe(responseDto);
    });

    it('throws NotFoundException when the user is not found', async () => {
      (usersRepository.findOne as Mock).mockResolvedValue(null);

      await expect(service.find(999)).rejects.toThrow(NotFoundException);
      expect(languageRepository.find).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // findPaginated()
  // ---------------------------------------------------------------
  describe('findPaginated', () => {
    let qb: Mocked<Partial<SelectQueryBuilder<User>>>;

    beforeEach(() => {
      qb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn(),
      };
      (usersRepository.createQueryBuilder as Mock).mockReturnValue(qb);
    });

    it('returns paginated results without a search filter', async () => {
      const users = [{ id: 1 }, { id: 2 }] as User[];
      const languages = [{ id: 1 }] as Language[];

      (languageRepository.find as Mock).mockResolvedValue(languages);
      (qb.getManyAndCount as Mock).mockResolvedValue([users, 2]);
      (UserMapper.toResponseDTO as Mock).mockImplementation((u: User) => ({ id: u.id }));

      const query = { page: 1, limit: 10 } as PaginateUserDto;

      const result = await service.findPaginated(query);

      expect(usersRepository.createQueryBuilder).toHaveBeenCalledWith('users');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('users.role', 'roles');
      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(qb.orderBy).toHaveBeenCalledWith('users.id', 'DESC');
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        data: [{ id: 1 }, { id: 2 }],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      });
    });

    it('applies the search filter and correct pagination offset', async () => {
      (languageRepository.find as Mock).mockResolvedValue([]);
      (qb.getManyAndCount as Mock).mockResolvedValue([[], 0]);

      const query = { page: 3, limit: 5, search: 'john' } as PaginateUserDto;

      await service.findPaginated(query);

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(users.email LIKE :search OR users.first_name LIKE :search OR users.last_name LIKE :search)',
        { search: '%john%' },
      );
      expect(qb.skip).toHaveBeenCalledWith(10); // (page 3 - 1) * limit 5
      expect(qb.take).toHaveBeenCalledWith(5);
    });

    it('computes totalPages correctly for uneven totals', async () => {
      (languageRepository.find as Mock).mockResolvedValue([]);
      (qb.getManyAndCount as Mock).mockResolvedValue([[], 7]);

      const query = { page: 1, limit: 3 } as PaginateUserDto;

      const result = await service.findPaginated(query);

      expect(result.meta.totalPages).toBe(3); // ceil(7 / 3)
    });
  });
});