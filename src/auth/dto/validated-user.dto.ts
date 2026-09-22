import { Role } from "../../roles/role.entity.js";

export class ValidatedUserDto {
  id: number;
  firstName: string;
  lastName: string;
  roleId: number;
  role: Role;
  langIds: number[];
  email: string;
  profileImage: string | null;
};
