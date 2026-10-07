import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Post } from "./post.entity.js";
import { Category } from "../category/category.entity.js";
import { PostController } from "./post.controller.js";
import { PostService } from "./post.service.js";
import { Upload } from "../upload/upload.entity.js";
import { Status } from "../status/status.entity.js";
import { User } from "../users/user.entity.js";


@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Category, Upload, Status, User]),
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
