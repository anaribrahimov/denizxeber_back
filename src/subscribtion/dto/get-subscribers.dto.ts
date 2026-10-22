import { IsInt, IsOptional, Max, Min } from "class-validator";
import { LangCodeQueryDto } from "../../common/dto/lang-code-query.dto.js";
import { Type } from "class-transformer";

export class GetSubscribersDto extends LangCodeQueryDto {

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 1;

  @IsOptional()
  email?: string | null;
}
