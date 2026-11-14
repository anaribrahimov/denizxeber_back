import { Role } from "../../roles/role.entity.js";
import { AuthProfileImageDto } from "./auth-profile-image.dto.js";

export class ValidatedUserDto {
  id: number;
  firstName: string;
  lastName: string;
  roleId: number;
  role: Role;
  langIds: number[];
  email: string;
  profileImage: AuthProfileImageDto | null;
};
