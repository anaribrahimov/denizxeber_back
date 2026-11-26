// import { ApiProperty } from "@nestjs/swagger";
import { BannerNameDto } from "../../banner-name/dto/banner-name.dto.js";
import { PriorityDto } from "../../priority/dto/priority.dto.js";
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
  rowNumber: number | null;
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

  priorities: PriorityDto[];

  banners: BannerNameDto[];
}
