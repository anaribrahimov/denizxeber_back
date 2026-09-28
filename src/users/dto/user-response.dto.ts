import { Role } from "../../roles/role.entity.js";
import { Language } from "../../language/language.entity.js";
import { ApiProperty } from "@nestjs/swagger";
import { PaginatedResult } from "../../common/interfaces/paginated-result.interface.js";

export class UserProfileImageResult {
  originalUrl?: string;
  thumbnailUrl?: string | null;
}

export class UserResponseDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  languages: Language[];
  createdAt: Date;
  updatedAt?: Date | null;
  isActive: boolean;
  profileImage: UserProfileImageResult | null;
}

export class ControllerUserResponseDto {

  @ApiProperty()
  data: UserResponseDTO;
}

export class ControllerUsersResponseDto implements PaginatedResult<UserResponseDTO> {
  data: UserResponseDTO[];
  meta: { 
    total: number; 
    page: number; 
    limit: number; 
    totalPages: number; 
  };
}
