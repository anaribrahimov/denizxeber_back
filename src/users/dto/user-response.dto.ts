import { Role } from "../../roles/role.entity.js";
import { Language } from "../../language/language.entity.js";

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
  publishedPostCount?: number | null;
  draftPostCount?: number | null;
}
