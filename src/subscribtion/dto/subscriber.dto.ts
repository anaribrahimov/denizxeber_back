import { LanguageDto } from "../../language/dto/language.dto.js";

export class SubscriberDto {

  id: number;

  email: string;

  language: LanguageDto;

  createdAt: Date;
}
