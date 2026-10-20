import {
  applyDecorators,
  Type,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';

export function ApiDataResponse<TModel extends Type<unknown>>(
  model: TModel,
  status: number,
  description: string,
  summary: string,
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      description,
      summary,
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(model),
          },
        },
      },
    }),
  );
}
