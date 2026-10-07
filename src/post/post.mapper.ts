import slug from "slug";
import { CreatePostDto } from "./dto/create-post.dto.js";
import { Post } from "./post.entity.js";
import { createPreviewUrl } from "../common/utils/media.util.js";
import { PostDto } from "./dto/post.dto.js";
import { PostCategoryDto } from "./dto/post-category.dto.js";
import { PostCoverImageDto } from "./dto/post-cover-image.dto.js";
import { PostUserDto } from "./dto/post-user.dto.js";

export class PostMapper {

  public static toDto(
    post: Post,
    publicUrl: string,
  ): PostDto {
    const postDto = new PostDto();
    postDto.id = post.id;
    postDto.category = {
      id: post.category.id,
      name: post.category.name,
      slug: post.category.slug
    } as PostCategoryDto;
    postDto.title = post.title;
    if (post.content) {
      postDto.content = post.content;
    }
    postDto.slug = post.slug;
    postDto.createdAt = post.createdAt;
    postDto.updatedAt = post.updatedAt;
    postDto.viewCount = post.viewCount;
    postDto.sortAt = post.sortAt;
    postDto.isUpdating = post.isUpdating;
    postDto.status = post.status!.name;

    if (post.coverImage) {
      const coverImageDto = new PostCoverImageDto();
      coverImageDto.originalUrl = createPreviewUrl(publicUrl, post.coverImage.fileKey);
      coverImageDto.thumbnailUrl = 
        Array.isArray(post.coverImage.versions) && post.coverImage.versions.length
          ? createPreviewUrl(publicUrl, post.coverImage.versions[0].fileKey)
          : null;
      postDto.coverImage = coverImageDto;
    } else {
      postDto.coverImage = null;
    }

    postDto.author = post.author
      ? {
          id: post.author.id,
          email: post.author.email,
          firstName: post.author.firstName,
          lastName: post.author.lastName,
        } as PostUserDto
      : null;

    if (post.lastUpdatedBy) {
      postDto.lastUpdatedBy = {
        id: post.lastUpdatedBy.id,
        email: post.lastUpdatedBy.email,
        firstName: post.lastUpdatedBy.firstName,
        lastName: post.lastUpdatedBy.lastName,
      } as PostUserDto;
    }

    return postDto;
  }

  public static toEntity(
    createPostDto: CreatePostDto, 
    authorId: number
  ): Post {
    const post = new Post();
    post.categoryId = createPostDto.categoryId;
    post.isUpdating = createPostDto.isUpdating ?? false;
    post.authorId = authorId;
    post.statusId = createPostDto.statusId ?? null;
    post.coverImageId = createPostDto.coverImageId ?? null;
    post.title = createPostDto.title;
    post.slug = `${slug(createPostDto.title)}-${Date.now()}`;
    post.content = createPostDto.content;

    return post;
  }
}
