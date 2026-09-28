import { Upload, UploadType } from "./upload.entity.js";
import { UploadResponseDto } from "./dto/upload-response.dto.js";
import { UploadVersion, UploadVersionType } from "./upload-version.entity.js";
import { UploadVersionResponseDto } from "./dto/upload-version-response.dto.js";
import { createPreviewUrl } from "../common/utils/media.util.js";

export class UploadMapper {

  public static toUploadVersionEntity(
    upload: Upload,
    version: UploadVersionType,
    fileName: string,
    fileMimeType: string,
    fileKey: string,
    fileWidth: number|null,
    fileHeight: number|null,
    fileSizeByte: number|null,
  ): UploadVersion {
    const uploadVersion = new UploadVersion();
    uploadVersion.uploadId = upload.id;
    uploadVersion.version = version;
    uploadVersion.fileName = fileName;
    uploadVersion.fileMimeType = fileMimeType;
    uploadVersion.fileKey = fileKey;
    uploadVersion.fileWidth = fileWidth;
    uploadVersion.fileHeight = fileHeight;
    uploadVersion.fileSizeByte = fileSizeByte;
    return uploadVersion;
  }

  public static toEntity(
    type: UploadType,
    fileName: string,
    fileOriginalName: string,
    fileKey: string,
    fileMimeType: string,
    fileSizeByte: number|null,
    fileWidth: number|null,
    fileHeight: number|null,
    durationSec: number|null,
    versions: UploadVersion[]|null,
  ): Upload {
    const upload = new Upload();
    upload.type = type;
    upload.fileName = fileName;
    upload.fileOriginalName = fileOriginalName;
    upload.filePath = fileKey;
    upload.fileKey = fileKey;
    upload.fileMimeType = fileMimeType;
    upload.fileSizeByte = fileSizeByte;
    upload.fileWidth = fileWidth;
    upload.fileHeight = fileHeight;
    upload.durationSec = durationSec;
    upload.versions = versions;
    return upload;
  }

  public static toUploadResponseDto(upload: Upload, publicUrl: string): UploadResponseDto {
    const dto = new UploadResponseDto();
    dto.id = upload.id;
    dto.fileOriginalName = upload.fileOriginalName;
    dto.fileName = upload.fileName;
    dto.fileKey = upload.fileKey;
    dto.fileWidth = upload.fileWidth;
    dto.fileHeight = upload.fileHeight;
    dto.durationSec = upload.durationSec;
    dto.createdAt = upload.createdAt;
    dto.preview = createPreviewUrl(publicUrl, upload.fileKey);
    dto.versions = 
      upload.versions?.map(
        (uploadVersion: UploadVersion) => ({
          id: uploadVersion.id,
          version: uploadVersion.version,
          fileName: uploadVersion.fileName,
          fileKey: uploadVersion.fileKey,
          fileWidth: uploadVersion.fileWidth,
          fileHeight: uploadVersion.fileHeight,
          fileSizeByte: uploadVersion.fileSizeByte,
          preview: createPreviewUrl(publicUrl, uploadVersion.fileKey),
        })
      ) as UploadVersionResponseDto[] ?? [];
    return dto;
  }
}