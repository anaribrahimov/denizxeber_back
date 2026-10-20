import { IsIn, IsNotEmpty, IsString } from "class-validator";
import { languageCodes } from "../../language/language.cache.js";

export class LangCodeQueryDto {

  @IsNotEmpty()
  @IsString()
  @IsIn(languageCodes)
  langCode: string;
}
