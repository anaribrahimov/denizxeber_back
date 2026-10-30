import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Upload, UploadType } from "./upload.entity.js";
import { MediaService, ProcessedFileResult } from "../common/services/media.service.js";
import { StorageService } from "../common/services/storage.service.js";
import { UploadMapper } from "./upload.mapper.js";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, IsNull, LessThan, MoreThan, Not, QueryRunner, Repository } from "typeorm";
import { UploadVersion } from "./upload-version.entity.js";
import { parseRangeHeader } from "../common/utils/range.util.js";
import { RangeNotSatisfiableException } from "../common/exceptions/range-not-satisfiable.exception.js";
import { ReadFileResult } from "../common/interfaces/file-stream.interface.js";
import { UploadResponseDto } from "./dto/upload-response.dto.js";
import { PaginatedResult } from "../common/interfaces/paginated-result.interface.js";
import { PaginateUploadDto } from "./dto/paginate-upload.dto.js";
import { AuthUser } from "../auth/interfaces/auth-user.interface.js";
import { User } from "../users/user.entity.js";
import { Post } from "../post/post.entity.js";
import { StatusEnum } from "../status/status.cache.js";
import dayjs from "dayjs";

@Injectable()
export class UploadService {

  private readonly logger = new Logger(UploadService.name);
  private readonly publicUrl: string;

  constructor(
    private readonly storageService: StorageService,
    private readonly mediaService: MediaService,
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ){
    this.publicUrl = this.mediaService.getFilePublicUrl();
  }

  public getPublicUrl(): string {
    return this.publicUrl;
  }

  public async saveUploadTransactional(
    processedFile: ProcessedFileResult, 
    queryRunner: QueryRunner,
    uploadType: UploadType,
    uploadedBy: number | null,
  ): Promise<Upload> {
    // create upload entity
    let upload: Upload = UploadMapper.toEntity(
      uploadType,
      processedFile.filename,
      processedFile.originalName,
      processedFile.fileKey,
      processedFile.mimeType,
      processedFile.size,
      processedFile.width,
      processedFile.height,
      processedFile.durationInSec ?? null,
      null,
      uploadedBy,
    );

    // save upload
    await queryRunner.manager.save(upload);

    if (processedFile.thumbnailKey) {
      const version: UploadVersion = UploadMapper.toUploadVersionEntity(
        upload,
        processedFile.thumbnailFilename!,
        processedFile.thumbnailMimeType!,
        processedFile.thumbnailKey,
        processedFile.thumbnailWidth,
        processedFile.thumbnailHeight,
        processedFile.thumbnailSizeInBytes
      )

      // save upload versions
      await queryRunner.manager.save(version);

      // set upload entity versions
      upload.versions = [version];
    }

    return upload;
  }

  public async processFile(file: Express.Multer.File): Promise<ProcessedFileResult> {
    return this.mediaService.processUpload(file);
  }
  
  public async create(
    file: Express.Multer.File,
    userPrincipal: AuthUser,
  ): Promise<UploadResponseDto> {
    const processedFile = await this.processFile(file);
    // console.log(processedFile);

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    // const publicUrl = this.mediaService.getFilePublicUrl();

    try {

      // find owner
      const owner = await this.userRepository
        .findOne({
          where: {
            id: userPrincipal.userId
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        });

      // save upload to db
      const upload: Upload = await this.saveUploadTransactional(
        processedFile, 
        queryRunner, 
        UploadType.PUBLIC,
        userPrincipal.userId,
      );

      await queryRunner.commitTransaction(); // commit transaction

      upload.owner = owner;

      return UploadMapper.toUploadResponseDto(upload, this.publicUrl, null);

    } catch (err) {

      if (processedFile.path) {
        await this.storageService.delete(processedFile.path);
      }
      
      if (processedFile.thumbnailPath) {
        await this.storageService.delete(processedFile.thumbnailPath);
      }
      
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  public async findById(id: number): Promise<UploadResponseDto> {
    const upload = await this.uploadRepository
      .createQueryBuilder('u')
      .withDeleted()
      .leftJoinAndSelect('u.versions', 'v')
      .leftJoin('u.owner', 'o')
      .addSelect('o.id')
      .addSelect('o.firstName')
      .addSelect('o.lastName')
      .addSelect('o.email')
      .where('u.id = :id', { id })
      .andWhere('u.deletedAt IS NULL')
      .getOne()

    if (!upload) {
      throw new NotFoundException("Upload not found");
    }

    const latestPost = await this.postRepository
      .findOne({
        where: {
          coverImageId: id,
          statusId: StatusEnum.Published,
        },
        order: {
          id: 'DESC'
        },
        select: {
          title: true
        }
      });

    return UploadMapper.toUploadResponseDto(
      upload, 
      this.publicUrl, 
      latestPost?.title ?? null
    );
  }

  async readFile(
    fileKey: string,
    rangeHeader: string | undefined | null,
  ): Promise<ReadFileResult> {
    const upload = await this.uploadRepository
      .createQueryBuilder('upload')
      .leftJoinAndSelect('upload.versions', 'version')
      .where('upload.fileKey = :fileKey', { fileKey })
      .orWhere('version.fileKey = :fileKey', { fileKey })
      .getOne();

    if (!upload) {
      throw new NotFoundException('File not found');
    }

    let mimetype: string;
    let sizeByte: number|null;
    let durationSec: number | null = null;

    if (upload.fileKey === fileKey) {
      mimetype = upload.fileMimeType;
      sizeByte = upload.fileSizeByte;
      durationSec = upload.durationSec ?? null;
    } else {
      const version: UploadVersion | undefined = upload.versions?.find(
        (v) => v.fileKey === fileKey,
      );

      if (!version) {
        throw new NotFoundException('File not found');
      }

      mimetype = version.fileMimeType;
      sizeByte = version.fileSizeByte;
    }

    if (!sizeByte) {
      sizeByte = await this.storageService.getFileSizeByte(fileKey);
    }

    const range = parseRangeHeader(rangeHeader, sizeByte);

    if (!range) {
      const stream = this.storageService.readFileStream(fileKey);
      return {
        stream,
        mimetype,
        sizeByte,
        durationSec,
        start: 0,
        end: sizeByte - 1,
        status: 200,
      };
    }

    const { start, end } = range;
    if (start < 0 || end >= sizeByte || start > end) {
      throw new RangeNotSatisfiableException(sizeByte);
    }

    const stream = this.storageService.readFileStream(fileKey, { start, end });
    return {
      stream,
      mimetype,
      sizeByte,
      durationSec,
      start,
      end,
      status: 206,
    };
  }

  async delete(id: number): Promise<void> {
    const upload = await this.uploadRepository
      .exists({
        where: {
          id,
          type: UploadType.PUBLIC,
        }
      });
    if (!upload) {
      throw new NotFoundException('Upload not found');
    }
    await this.uploadRepository.softDelete(id);
  }

  async findPaginated(
    query: PaginateUploadDto
  ): Promise<PaginatedResult<UploadResponseDto>> {
    const { limit, page, fileName } = query;

    const qb = this.uploadRepository
      .createQueryBuilder('uploads')
      .withDeleted()
      .leftJoinAndSelect('uploads.versions', 'versions')
      .leftJoin('uploads.owner', 'owner')
      .where('uploads.type = :type', { type: UploadType.PUBLIC })
      .addSelect('owner.id')
      .addSelect('owner.firstName')
      .addSelect('owner.lastName')
      .addSelect('owner.email')
      .addSelect((subQuery) => 
        subQuery
          .select('p.title')
          .from(Post, 'p')
          .where('p.statusId = :statusId', { 
            statusId: StatusEnum.Published
          })
          .where('p.coverImageId = uploads.id')
          .andWhere('p.deletedAt IS NULL')
          .orderBy('p.createdAt', 'DESC')
          .limit(1),
        'latestPostTitle'
      )

    if (fileName?.trim()) {
      qb.andWhere('uploads.fileOriginalName LIKE :fileName', {
        fileName: `%${fileName.trim()}%`,
      })
    }

    qb
      .andWhere('uploads.deletedAt IS NULL')
      .orderBy('uploads.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [{ entities, raw }, total] = await Promise.all([
      qb.getRawAndEntities(),
      qb.clone().getCount()
    ])

    // Index raw rows by user ID to avoid relying on array position.
    const postTiteByUploadId = new Map<
      string | number,
      { latestPostTitle: string | null }
    >();

    for (const row of raw) {
      const uplaodId = row.uploads_id;

      if (uplaodId == null) {
        continue;
      }

      postTiteByUploadId.set(uplaodId, {
        latestPostTitle: row.latestPostTitle ?? null
      });
    }

    const data = entities.map((upload) => {
      const postTitle = postTiteByUploadId.get(upload.id);
      return UploadMapper.toUploadResponseDto(
        upload, 
        this.publicUrl, 
        postTitle?.latestPostTitle ?? null
      );
    })

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }
  }

  async purgeDeleteds(): Promise<number> {
    const batchSize = 100;
    const sevenDaysAgo = dayjs().subtract(7, 'days').toDate();

    let lastId = 0;
    let totalDeleted = 0;

    while (true) {
      const queryRunner = this.dataSource.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const uploads = await queryRunner.manager.find(Upload, {
          withDeleted: true,
          where: {
            deletedAt: LessThan(sevenDaysAgo),
            id: MoreThan(lastId),
          },
          relations: {
            versions: true,
          },
          order: {
            id: 'ASC',
          },
          take: batchSize,
          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (uploads.length === 0) {
          await queryRunner.commitTransaction();
          break;
        }

        const uploadIds = uploads.map((upload) => upload.id);

        // Delete files from storage
        for (const upload of uploads) {
          const fileKey = upload.fileKey?.trim();

          if (fileKey) {
            const filePath = this.storageService.getAbsolutePath(
              fileKey,
            )
  
            if (filePath) {
              await this.storageService.delete(filePath);
            }
          }

          for (const version of upload.versions ?? []) {
            const versionKey = version.fileKey?.trim();

            if (versionKey) {
              const versionPath = this.storageService.getAbsolutePath(
                versionKey,
              );
  
              if (versionPath) {
                await this.storageService.delete(versionPath);
              }
            }
          }
        }

        // Permanently delete upload versions
        await queryRunner.manager.delete(UploadVersion, {
          uploadId: In(uploadIds),
        });

        // Permanently delete uploads
        await queryRunner.manager.delete(Upload, {
          id: In(uploadIds),
        });

        await queryRunner.commitTransaction();

        // Update cursor only after successful commit
        lastId = uploads[uploads.length - 1].id;
        totalDeleted += uploads.length;
      } catch (error) {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }

        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    return totalDeleted;
  }
}
