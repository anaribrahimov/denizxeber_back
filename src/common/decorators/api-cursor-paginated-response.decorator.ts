import { applyDecorators, Type } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { CursorPaginationMetaDto } from "../dto/cursor-pagination-meta.dto.js";

export function ApiCursorPaginatedResponse<TModel extends Type<unknown>>(
  model: TModel,
) {
  return applyDecorators(
    ApiExtraModels(model, CursorPaginationMetaDto),
    ApiOkResponse({
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: getSchemaPath(model)
            }
          },
          meta: {
            $ref: getSchemaPath(CursorPaginationMetaDto),
          },
        },
      },
    }),
  );
}
