import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Upload } from "./upload.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([Upload])],
  // controllers: [RolesController],
  // providers: [RolesService],
  // exports: [RolesService],
})
export class UploadsModule {}
