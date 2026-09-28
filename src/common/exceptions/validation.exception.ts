import { BadRequestException } from '@nestjs/common';

/**
 * Throws a BadRequestException with the exact same shape
 * class-validator/ValidationPipe produces, so manual business-rule
 * validation errors are indistinguishable from DTO validation errors.
 */
export class ValidationException extends BadRequestException {
  constructor(errors: Record<string, string[]>, message: string = 'Validation failed') {
    super({
      statusCode: 400,
      message: message ?? 'Validation failed',
      errors,
    });
  }
}
