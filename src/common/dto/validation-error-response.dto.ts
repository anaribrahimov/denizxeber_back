import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidationErrorResponseDto {
  @ApiProperty({
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    example: 'Validation failed',
  })
  message: string;

  @ApiPropertyOptional({
    example: {
      field1: ['field1 error message'],
      field2: ['field2 error message'],
    },
    additionalProperties: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  })
  errors?: Record<string, string[]>;

  @ApiProperty({
    example: '2026-09-15T05:51:15.964Z',
  })
  timestamp: string;

  @ApiProperty({
    example: '/admin/categories',
  })
  path: string;
}
