import { applyDecorators, Type } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, ApiResponse, getSchemaPath } from "@nestjs/swagger";

export function ApiDataArrayResponse<TModel extends Type<unknown>>(
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
            type: 'array',
            items: {
              $ref: getSchemaPath(model),
            },
          },
        },
      },
    }),
  );
}
