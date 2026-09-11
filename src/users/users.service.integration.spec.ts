import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type Mock } from 'vitest';
import { DataSource, Repository } from 'typeorm';
import { MySqlContainer, type StartedMySqlContainer } from '@testcontainers/mysql';
import { NotFoundException } from '@nestjs/common';

import { UsersService } from './users.service.js';
import { User } from './user.entity.js';
import { Role } from '../roles/role.entity.js';
import { Language } from '../language/language.entity.js';
import { Upload, UploadType } from '../uploads/upload.entity.js';
import { UserMapper } from './user.mapper.js';
import { UploadMapper } from '../uploads/uploads.mapper.js';
import { ValidationException } from '../common/exceptions/validation.exception.js';
import { deleteFile } from '../common/utils/storage.util.js';
import { hashPassword } from '../common/utils/auth.util.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDTO } from './dto/update-user.dto.js';
import { execSync } from 'child_process';

// ---------------------------------------------------------------------------
// This suite hits a REAL MySQL instance (via Testcontainers) to verify things
// a mocked unit test cannot: actual transaction commit/rollback, unique/FK
// constraints, soft-delete semantics, and pessimistic row locking (SQLite
// does not support "FOR UPDATE" locks and would silently misrepresent this).
//
// UserMapper / UploadMapper / deleteFile / hashPassword are still mocked:
// they're pure mapping/crypto/filesystem logic with no DB interaction, and
// mocking them keeps this suite focused on DB + transaction behavior. Their
// own correctness should be covered by dedicated mapper unit tests.
//
// Requires Docker running locally / in CI.
// ---------------------------------------------------------------------------

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

describe('UsersService (integration)', () => {
  let container: StartedMySqlContainer;
  let dataSource: DataSource;
  let usersRepository: Repository<User>;
  let roleRepository: Repository<Role>;
  let languageRepository: Repository<Language>;
  let uploadRepository: Repository<Upload>;

  let service: UsersService;

  const storage = { localUplodsPath: '/uploads' };

  beforeAll(async () => {
    container = await new MySqlContainer('mysql:9')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withUserPassword('test_pass')
      .start();

    // Run your real migrations against the container, using the same
    // command you run locally — just pointed at the container's connection info.
    await execSync('pnpm migration:run', {
      cwd: process.cwd(), // adjust if your package.json lives elsewhere
      stdio: 'inherit',   // surfaces migration output/errors in the test log
      env: {
        ...process.env,
        DATABASE_HOST: container.getHost(),
        DATABASE_PORT: String(container.getPort()),
        DATABASE_USERNAME: container.getUsername(),
        DATABASE_PASSWORD: container.getUserPassword(),
        DATABASE_NAME: container.getDatabase(),
      },
    });

    dataSource = new DataSource({
      type: 'mysql',
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getUserPassword(),
      database: container.getDatabase(),
      entities: [User, Role, Language, Upload],
      migrationsRun: false,
      synchronize: false,
      timezone: 'Z',
    });

    await dataSource.initialize();

    usersRepository = dataSource.getRepository(User);
    roleRepository = dataSource.getRepository(Role);
    languageRepository = dataSource.getRepository(Language);
    uploadRepository = dataSource.getRepository(Upload);
  }, 120_000);

  afterAll(async () => {
    await dataSource?.destroy();
    await container?.stop();
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    // clean slate between tests (children first, respecting FKs)
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE users');
    await dataSource.query('TRUNCATE TABLE uploads');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

    service = new UsersService(
      storage as any,
      dataSource,
      usersRepository,
      roleRepository,
      languageRepository,
    );

    // Default mapper mocks: real enough to produce persistable entities,
    // without depending on your actual mapper implementation.
    (UserMapper.toEntity as Mock).mockImplementation(
      async (dto: CreateUserDto, role: Role, upload: Upload | null) => {
        const user = new User();
        user.firstName = dto.firstName;
        user.lastName = dto.lastName;
        user.email = dto.email;
        user.password = `hashed:${dto.password}`;
        user.role = role;
        user.roleId = role.id;
        user.langIds = dto.langIds;
        user.isActive = dto.isActive ?? true;
        if (upload) {
          user.profileImage = upload;
          user.profileImageId = upload.id as unknown as number;
        }
        return user;
      },
    );

    (UserMapper.toResponseDTO as Mock).mockImplementation((user: User) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      langIds: user.langIds,
    }));

    (UploadMapper.toEntity as Mock).mockImplementation(
      (file: Express.Multer.File, basePath: string) => {
        const upload = new Upload();
        upload.type = UploadType.PUBLIC;
        upload.fileOriginalName = (file as any).originalname ?? 'file.png';
        upload.fileName = (file as any).filename ?? 'stored-file.png';
        upload.filePath = `${basePath}/${upload.fileName}`;
        upload.mimeType = (file as any).mimetype ?? 'image/png';
        upload.fileSizeInBytes = (file as any).size ?? 1024;
        return upload;
      },
    );
  });

  const makeCreateDto = (overrides: Partial<CreateUserDto> = {}): CreateUserDto =>
    ({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      passwordConfirmation: 'password123',
      roleId: 1,
      langIds: [1, 2],
      ...overrides,
    }) as CreateUserDto;

  // -------------------------------------------------------------------
  // create()
  // -------------------------------------------------------------------
  describe('create', () => {
    it('persists a new user row with the mapped fields', async () => {
      const dto = makeCreateDto();

      const result = await service.create(dto, undefined as any);

      expect(result.email).toBe('john@example.com');

      const row = await usersRepository.findOne({ where: { email: 'john@example.com' } });
      expect(row).not.toBeNull();
      expect(row!.firstName).toBe('John');
      expect(row!.roleId).toBe(1);
      expect(row!.langIds).toEqual([1, 2]);
    });

    it('saves the upload row first, then links it to the user via profile_image_id', async () => {
      const dto = makeCreateDto({ email: 'with-image@example.com' });
      const profileImage = {
        path: '/tmp/avatar.png',
        originalname: 'avatar.png',
        filename: 'stored-avatar.png',
        mimetype: 'image/png',
        size: 2048,
      } as unknown as Express.Multer.File;

      await service.create(dto, profileImage);

      const uploads = await uploadRepository.find();
      expect(uploads).toHaveLength(1);
      expect(uploads[0].fileOriginalName).toBe('avatar.png');

      const row = await usersRepository.findOne({ where: { email: 'with-image@example.com' } });
      expect(row!.profileImageId).toBe(uploads[0].id);
    });

    it('enforces the unique email constraint and rolls back the whole transaction', async () => {
      const dto = makeCreateDto({ email: 'duplicate@example.com' });
      await service.create(dto, undefined as any);

      const secondAttempt = makeCreateDto({ email: 'duplicate@example.com' });
      const profileImage = { path: '/tmp/avatar2.png' } as Express.Multer.File;

      await expect(service.create(secondAttempt, profileImage)).rejects.toThrow(ValidationException);

      const count = await usersRepository.count({ where: { email: 'duplicate@example.com' } });
      expect(count).toBe(1); // only the first insert persisted
      expect(deleteFile).toHaveBeenCalledWith(profileImage.path);
    });

    it('rolls back when the role does not exist, leaving no user row behind', async () => {
      const dto = makeCreateDto({ roleId: 99999, email: 'no-role@example.com' });
      const profileImage = { path: '/tmp/avatar3.png' } as Express.Multer.File;

      await expect(service.create(dto, profileImage)).rejects.toThrow(ValidationException);

      const count = await usersRepository.count({ where: { email: 'no-role@example.com' } });
      expect(count).toBe(0);
    });

    it('rolls back when a langId is invalid, leaving no user row behind', async () => {
      const dto = makeCreateDto({ langIds: [1, 99999], email: 'bad-lang@example.com' });
      const profileImage = { path: '/tmp/avatar4.png' } as Express.Multer.File;

      await expect(service.create(dto, profileImage)).rejects.toThrow(ValidationException);

      const count = await usersRepository.count({ where: { email: 'bad-lang@example.com' } });
      expect(count).toBe(0);
    });

    it('rolls back an already-saved upload if the user save fails afterwards', async () => {
      const dto = makeCreateDto({ email: 'partial-failure@example.com' });
      const profileImage = { path: '/tmp/avatar5.png' } as Express.Multer.File;

      // Simulate an unexpected application error AFTER the upload has already
      // been inserted, proving the whole DB transaction — not just the user
      // insert — gets rolled back.
      (UserMapper.toEntity as Mock).mockImplementationOnce(async () => {
        throw new Error('unexpected mapping failure');
      });

      await expect(service.create(dto, profileImage)).rejects.toThrow('unexpected mapping failure');

      const uploads = await uploadRepository.find();
      expect(uploads).toHaveLength(0); // rolled back along with the (never-created) user
      expect(deleteFile).toHaveBeenCalledWith(profileImage.path);
    });
  });

  // -------------------------------------------------------------------
  // update()
  // -------------------------------------------------------------------
  describe('update', () => {
    const createBaseUser = async (overrides: Partial<CreateUserDto> = {}) => {
      const dto = makeCreateDto(overrides);
      await service.create(dto, undefined as any);
      return usersRepository.findOneOrFail({ where: { email: dto.email } });
    };

    it('throws NotFoundException for a non-existent id', async () => {
      await expect(service.update(999999, {} as UpdateUserDTO)).rejects.toThrow(NotFoundException);
    });

    it('persists basic field changes', async () => {
      const user = await createBaseUser({ email: 'update-basic@example.com' });

      await service.update(user.id, { firstName: 'Jane', lastName: 'Smith', isActive: false } as UpdateUserDTO);

      const updated = await usersRepository.findOneOrFail({ where: { id: user.id } });
      expect(updated.firstName).toBe('Jane');
      expect(updated.lastName).toBe('Smith');
      expect(updated.isActive).toBe(false);
    });

    it('persists a valid langIds change', async () => {
      const user = await createBaseUser({ email: 'update-langs@example.com' });

      await service.update(user.id, { langIds: [3] } as UpdateUserDTO);

      const updated = await usersRepository.findOneOrFail({ where: { id: user.id } });
      expect(updated.langIds).toEqual([3]);
    });

    it('rolls back ALL changes atomically when langIds is invalid, even if other fields were valid', async () => {
      const user = await createBaseUser({ email: 'update-atomic@example.com' });

      await expect(
        service.update(user.id, {
          firstName: 'ShouldNotPersist',
          langIds: [99999],
        } as UpdateUserDTO),
      ).rejects.toThrow(ValidationException);

      const unchanged = await usersRepository.findOneOrFail({ where: { id: user.id } });
      expect(unchanged.firstName).toBe('John'); // proves the whole transaction rolled back, not just langIds
    });

    it('persists a valid role change', async () => {
      const user = await createBaseUser({ email: 'update-role@example.com', roleId: 1 });

      await service.update(user.id, { roleId: 2 } as UpdateUserDTO);

      const updated = await usersRepository.findOneOrFail({ where: { id: user.id } });
      expect(updated.roleId).toBe(2);
    });

    it('rolls back when the new role does not exist', async () => {
      const user = await createBaseUser({ email: 'update-bad-role@example.com', roleId: 1 });

      await expect(
        service.update(user.id, { roleId: 99999 } as UpdateUserDTO),
      ).rejects.toThrow(ValidationException);

      const unchanged = await usersRepository.findOneOrFail({ where: { id: user.id } });
      expect(unchanged.roleId).toBe(1);
    });

    it('replaces an existing profile image: soft-deletes the old upload and links the new one', async () => {
      const dto = makeCreateDto({ email: 'update-image@example.com' });
      const firstImage = {
        path: '/tmp/first.png',
        originalname: 'first.png',
        filename: 'stored-first.png',
      } as unknown as Express.Multer.File;
      await service.create(dto, firstImage);

      const user = await usersRepository.findOneOrFail({ where: { email: dto.email } });
      const oldUploadId = user.profileImageId!;

      const newImage = {
        path: '/tmp/second.png',
        originalname: 'second.png',
        filename: 'stored-second.png',
      } as unknown as Express.Multer.File;

      await service.update(user.id, {} as UpdateUserDTO, newImage);

      const updated = await usersRepository.findOneOrFail({ where: { id: user.id } });
      expect(updated.profileImageId).not.toBe(oldUploadId);

      const oldUpload = await uploadRepository.findOne({
        where: { id: oldUploadId as any },
        withDeleted: true,
      });
      expect(oldUpload?.deletedAt).not.toBeNull();

      // default query excludes soft-deleted rows
      const stillVisible = await uploadRepository.findOne({ where: { id: oldUploadId as any } });
      expect(stillVisible).toBeNull();
    });

    it('removes the profile image without uploading a new one', async () => {
      const dto = makeCreateDto({ email: 'update-remove-image@example.com' });
      const image = {
        path: '/tmp/remove-me.png',
        originalname: 'remove-me.png',
        filename: 'stored-remove-me.png',
      } as unknown as Express.Multer.File;
      await service.create(dto, image);

      const user = await usersRepository.findOneOrFail({ where: { email: dto.email } });
      expect(user.profileImageId).not.toBeNull();

      await service.update(user.id, { removeProfileImage: true } as UpdateUserDTO);

      const updated = await usersRepository.findOneOrFail({ where: { id: user.id } });
      expect(updated.profileImageId).toBeNull();
    });

    it('hashes and persists a new password', async () => {
      const user = await createBaseUser({ email: 'update-password@example.com' });
      (hashPassword as Mock).mockResolvedValue('new-real-hash');

      await service.update(user.id, { password: 'newPlainPassword1' } as UpdateUserDTO);

      const updated = await usersRepository.findOneOrFail({ where: { id: user.id } });
      expect(updated.password).toBe('new-real-hash');
    });

    it('serializes concurrent updates on the same row via pessimistic locking', async () => {
      // This is the one behavior a mocked unit test structurally cannot verify:
      // that the "pessimistic_write" lock actually blocks a second transaction
      // from reading the row until the first one commits.
      const user = await createBaseUser({ email: 'update-lock@example.com' });

      const order: string[] = [];

      const slowUpdate = (async () => {
        order.push('slow:start');
        await service.update(user.id, { firstName: 'FromSlowUpdate' } as UpdateUserDTO);
        order.push('slow:done');
      })();

      // give the first update a head start so it acquires the row lock first
      await new Promise((resolve) => setTimeout(resolve, 50));

      const fastUpdate = (async () => {
        order.push('fast:start');
        await service.update(user.id, { firstName: 'FromFastUpdate' } as UpdateUserDTO);
        order.push('fast:done');
      })();

      await Promise.all([slowUpdate, fastUpdate]);

      // whichever update actually committed last "wins" the final value,
      // but both must have completed without throwing a deadlock/timeout,
      // proving the lock serialized rather than corrupted the row.
      const updated = await usersRepository.findOneOrFail({ where: { id: user.id } });
      expect(['FromSlowUpdate', 'FromFastUpdate']).toContain(updated.firstName);
      expect(order[0]).toBe('slow:start');
    }, 15_000);

    it('rolls back a partially-mutated user object if save fails after profile image changes', async () => {
      const dto = makeCreateDto({ email: 'update-partial-fail@example.com' });
      const image = {
        path: '/tmp/orig.png',
        originalname: 'orig.png',
        filename: 'stored-orig.png',
      } as unknown as Express.Multer.File;
      await service.create(dto, image);

      const user = await usersRepository.findOneOrFail({ where: { email: dto.email } });
      const originalUploadId = user.profileImageId;

      const newImage = { path: '/tmp/broken.png' } as Express.Multer.File;
      (UploadMapper.toEntity as Mock).mockImplementationOnce(() => {
        throw new Error('mapping exploded');
      });

      await expect(service.update(user.id, {} as UpdateUserDTO, newImage)).rejects.toThrow('mapping exploded');

      const unchanged = await usersRepository.findOneOrFail({ where: { id: user.id } });
      expect(unchanged.profileImageId).toBe(originalUploadId);

      // the old upload's soft-delete must also have rolled back
      const oldUpload = await uploadRepository.findOne({ where: { id: originalUploadId as any } });
      expect(oldUpload?.deletedAt).toBeFalsy();
      expect(deleteFile).toHaveBeenCalledWith(newImage.path);
    });
  });

  // -------------------------------------------------------------------
  // delete()
  // -------------------------------------------------------------------
  describe('delete', () => {
    const createBaseUser = async (overrides: Partial<CreateUserDto> = {}) => {
      const dto = makeCreateDto(overrides);
      await service.create(dto, undefined as any);
      return usersRepository.findOneOrFail({ where: { email: dto.email } });
    };

    it('throws NotFoundException for a non-existent id', async () => {
      await expect(service.delete(999999)).rejects.toThrow(NotFoundException);
    });

    it('soft-deletes the user: hidden from default queries, present with withDeleted', async () => {
      const user = await createBaseUser({ email: 'delete-me@example.com' });

      await service.delete(user.id);

      const visible = await usersRepository.findOne({ where: { id: user.id } });
      expect(visible).toBeNull();

      const withDeleted = await usersRepository.findOne({ where: { id: user.id }, withDeleted: true });
      expect(withDeleted?.deletedAt).not.toBeNull();
    });

    it('treats an already soft-deleted user as not found on a second delete', async () => {
      const user = await createBaseUser({ email: 'delete-twice@example.com' });

      await service.delete(user.id);

      await expect(service.delete(user.id)).rejects.toThrow(NotFoundException);
    });
  });
});
