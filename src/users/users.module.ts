import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersController } from "./users.controller.js";
import { User } from "./user.entity.js";
import { UsersService } from "./users.service.js";
import { Role } from "../roles/role.entity.js";
import { Language } from "../language/language.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Language])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
