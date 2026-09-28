import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersController } from "./users.controller.js";
import { User } from "./user.entity.js";
import { UsersService } from "./users.service.js";
import { Role } from "../roles/role.entity.js";
import { Language } from "../language/language.entity.js";
import { UploadModule } from "../upload/upload.module.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Language]),
    UploadModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
