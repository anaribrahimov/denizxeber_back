import {
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      // forbidNonWhitelisted: true,
      transform: true,

      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors: Record<string, string[]> = {};

        for (const error of errors) {
          if (error.constraints) {
            const propertyName = this.toSnakeCase(error.property);
            formattedErrors[propertyName] = Object.values(
              error.constraints,
            );
          }
        }

        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      },
    });
  }

  toSnakeCase(value: string): string {
    return value
      .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      .replace(/^_/, '');
  }
}
