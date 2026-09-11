import { Exclude, Expose, Type } from "class-transformer";
import { Role } from "../../roles/role.entity.js";
import { Language } from "../../language/language.entity.js";

// export class UserResponseDto {
//   @Expose()
//   id: number;

//   @Expose()
//   email: string;

//   @Expose()
//   firstName: string;

//   @Expose()
//   lastName: string;

//   // Custom computed property using a getter
//   @Expose()
//   get fullName(): string {
//     return `${this.firstName} ${this.lastName}`;
//   }

//   @Exclude()
//   password?: string; // Automatically stripped from responses

//   @Type(() => Role) 
//   @Expose()
//   role: Role;

//   @Expose()
//   langIds: number[];

//   @Expose()
//   isActive: boolean;

//   @Expose()
//   createdAt: Date;

//   @Expose()
//   updatedAt: Date;
// }

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
  profileImageUrl: string | null;
}
