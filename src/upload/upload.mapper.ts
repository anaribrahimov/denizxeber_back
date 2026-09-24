import { Injectable } from "@nestjs/common";
import { Upload, UploadType } from "./upload.entity.js";
import { UploadResponseDto } from "./dto/upload-response.dto.js";

@Injectable()
export class UploadMapper {

  public toEntity(
    type: UploadType,
    fileName: string,
    fileOriginalName: string,
    filePath: string,
    mimeType: string,
    fileSizeInBytes: number|null,
    fileWidth: number|null,
    fileHeight: number|null,
    thumbPath: string|null,
    thumbWidth: number|null,
    thumbHeight: number|null,
    thumbSizeInBytes: number|null,
    durationInSec: number|null,
  ): Upload {
    const upload = new Upload();
    upload.type = type;
    upload.fileName = fileName;
    upload.fileOriginalName = fileOriginalName;
    upload.filePath = filePath;
    upload.mimeType = mimeType;
    upload.fileSizeInBytes = fileSizeInBytes;
    upload.fileWidth = fileWidth;
    upload.fileHeight = fileHeight;
    upload.thumbPath = thumbPath;
    upload.thumbWidth = thumbWidth;
    upload.thumbHeight = thumbHeight;
    upload.thumbSizeInBytes = thumbSizeInBytes;
    upload.durationInSec = durationInSec;
    return upload;
  }

  public toUploadResponseDto(upload: Upload): UploadResponseDto {
    const dto = new UploadResponseDto();
    dto.id = upload.id;
    dto.fileOriginalName = upload.fileOriginalName;
    dto.fileName = upload.fileName;
    dto.filePath = upload.filePath;
    dto.fileWidth = upload.fileWidth;
    dto.fileHeight = upload.fileHeight;
    dto.mimeType = upload.mimeType;
    dto.thumbPath = upload.thumbPath;
    dto.thumbWidth = upload.thumbWidth;
    dto.thumbHeight = upload.thumbHeight;
    dto.thumbSizeInBytes = upload.thumbSizeInBytes;
    dto.durationInSec = upload.durationInSec;
    dto.createdAt = upload.createdAt;
    return dto;
  }
}