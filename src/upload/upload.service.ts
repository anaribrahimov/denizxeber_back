import { Injectable, NotFoundException } from "@nestjs/common";
import { Upload, UploadType } from "./upload.entity.js";
import { MediaService } from "../common/services/media.service.js";
import { StorageService } from "../common/services/storage.service.js";
import { UploadMapper } from "./upload.mapper.js";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { UploadVersion, UploadVersionType } from "./upload-version.entity.js";
import { parseRangeHeader } from "../common/utils/range.util.js";
import { RangeNotSatisfiableException } from "../common/exceptions/range-not-satisfiable.exception.js";
import { ReadFileResult } from "../common/interfaces/file-stream.interface.js";
import { UploadResponseDto } from "./dto/upload-response.dto.js";
import { PaginatedResult } from "../common/interfaces/paginated-result.interface.js";
import { PaginateUploadDto } from "./dto/paginate-upload.dto.js";

@Injectable()
export class UploadService {

  constructor(
    private readonly storageService: StorageService,
    private readonly mediaService: MediaService,
    private readonly uploadMapper: UploadMapper,
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
    private readonly dataSource: DataSource,
  ){}
  
  public async create(file: Express.Multer.File): Promise<UploadResponseDto> {
    const processedFile = await this.mediaService.processUpload(file);
    // console.log(processedFile);

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // create upload entity
      let upload: Upload = this.uploadMapper.toEntity(
        UploadType.PUBLIC,
        processedFile.filename,
        processedFile.originalName,
        processedFile.fileKey,
        processedFile.mimeType,
        processedFile.size,
        processedFile.width,
        processedFile.height,
        processedFile.durationInSec,
        null
      );

      // save upload
      await queryRunner.manager.save(upload);

      if (processedFile.thumbnailKey) {
        const version: UploadVersion = this.uploadMapper.toUploadVersionEntity(
          upload,
          UploadVersionType.SMALL,
          processedFile.thumbnailFilename!,
          processedFile.thumbnailMimeType,
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

      await queryRunner.commitTransaction(); // commit transaction

      return this.uploadMapper.toUploadResponseDto(upload);

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
    const upload = await this.uploadRepository.findOne({
      where: {
        id
      },
      relations: {
        versions: true
      }
    });

    if (!upload) {
      throw new NotFoundException("Upload not found");
    }

    return this.uploadMapper.toUploadResponseDto(upload);
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
    const upload = await this.uploadRepository.existsBy({ id });
    if (!upload) {
      throw new NotFoundException('Upload not found');
    }
    await this.uploadRepository.softDelete(id);
  }

  async findPaginated(query: PaginateUploadDto): Promise<PaginatedResult<UploadResponseDto>> {
    const { limit, page } = query;

    const qb = this.uploadRepository
      .createQueryBuilder('uploads')
      .leftJoinAndSelect('uploads.versions', 'versions')
      .where('uploads.type = :type', { type: UploadType.PUBLIC })

    qb.orderBy('uploads.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((item: Upload) => this.uploadMapper.toUploadResponseDto(item)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }
  }
}
