import {
  FileValidator,
  PayloadTooLargeException,
} from '@nestjs/common';

export class MaxFileSizeValidator extends FileValidator<{
  maxImageSize: number;
  maxVideoSize: number;
}> {
  isValid(file: Express.Multer.File): boolean {
    const isImage = file.mimetype.startsWith('image/');
    const maxSize = isImage
      ? this.validationOptions.maxImageSize
      : this.validationOptions.maxVideoSize;

    if (file.size > maxSize) {
      throw new PayloadTooLargeException(
        `Payload too large. Maximum allowed ${isImage ? 'image' : 'video'} size is ${maxSize} bytes`,
      );
    }

    return true;
  }

  buildErrorMessage(): string {
    return 'Payload too large';
  }
}
