// import { ApiProperty } from "@nestjs/swagger";
import { Priority } from "../../priority/priority.entity.js";
import { Status } from "../../status/status.entity.js";
import { ValidatedUserDto } from "./validated-user.dto.js";

class Language {
  
  id: number;

  name: string;
}

class Category {
  id: number;
  name: string;
  slug: string;
}

export class LoginResponseCategoryItem {

  langId: number;

  name: string;

  categories: Category[];
}

export class LoginResponseDto {

  accessToken: string;

  user: ValidatedUserDto;

  categories: LoginResponseCategoryItem[];

  languages: Language[];

  statuses: Status[];

  priorities: Priority[];
}
