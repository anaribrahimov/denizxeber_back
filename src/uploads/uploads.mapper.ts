import { relative } from "path";
import { Upload, UploadType } from "./upload.entity.js";

export class UploadMapper {

  static toEntity(file: Express.Multer.File, localStoragePath: string, isPrivate: boolean): Upload {
    const upload = new Upload();
    upload.fileOriginalName = file.originalname;
    upload.fileName = file.filename;
    upload.filePath = relative(localStoragePath, file.path);
    upload.mimeType = file.mimetype;
    upload.fileSizeInBytes = file.size;
    upload.type = isPrivate ? UploadType.PRIVATE : UploadType.PUBLIC;
    return upload;
  }
}
