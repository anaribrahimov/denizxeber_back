import { IsEmail, IsIn, IsInt, IsNotEmpty, MaxLength } from "class-validator";
import { languages } from "../../language/language.cache.js";

export class CreateSubscriberDto {

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsInt()
  @IsIn(languages.map((item) => item.id))
  langId: number;
}
