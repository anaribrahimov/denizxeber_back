import { Role } from "../../roles/role.entity.js";

export interface AuthUser {
  userId: number,
  email: string,
  role: Role,
  langIds?: number[]
};
