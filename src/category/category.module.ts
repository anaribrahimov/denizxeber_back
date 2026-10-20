import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoryController } from "./category.controller.js";
import { CategoryService } from "./category.service.js";
import { Category } from "./category.entity.js";
import { Post } from "../post/post.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([Category, Post])],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
