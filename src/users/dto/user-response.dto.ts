import { Role } from "../../roles/role.entity.js";
import { Language } from "../../language/language.entity.js";
import { ProfileImageResponseDto } from "./profile-image-response.dto.js";

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
  profileImage: ProfileImageResponseDto | null;
  publishedPostCount?: number | null;
  draftPostCount?: number | null;
}
