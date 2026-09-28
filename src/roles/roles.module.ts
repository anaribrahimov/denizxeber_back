import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Role } from "./role.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  // controllers: [RolesController],
  // providers: [RolesService],
  // exports: [RolesService],
})
export class RolesModule {}
