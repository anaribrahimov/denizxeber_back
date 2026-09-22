// import { ApiProperty } from "@nestjs/swagger";
import { ValidatedUserDto } from "./validated-user.dto.js";

class Status {
  id: number;
  name: string;
}

class Priority {
  id: number;
  name: string;
}

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

  // statuses: Status[];

  // priorities: Priority[];
}
