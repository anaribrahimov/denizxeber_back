import { Role } from "../../roles/role.entity.js";
import { UserProfileImageResult } from "../../users/dto/user-response.dto.js";

export class ValidatedUserDto {
  id: number;
  firstName: string;
  lastName: string;
  roleId: number;
  role: Role;
  langIds: number[];
  email: string;
  profileImage: UserProfileImageResult | null
};
