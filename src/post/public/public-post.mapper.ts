import { Post } from "../post.entity.js";
import { PublicPostDto } from "./dto/public-post.dto.js";
import { PostCoverImageDto, PostCoverImageVersionItemDto } from "../dto/post-cover-image.dto.js";
import { createPreviewUrl } from "../../common/utils/media.util.js";
import { PostUserDto } from "../dto/post-user.dto.js";
import { PublicPostCategoryDto } from "./dto/post-category.dto.js";
import { prioritiesCached } from "../../priority/priority.cache.js";
import { generatePostCursor } from "../util/pagination.util.js";
import { UploadVersion } from "../../upload/upload-version.entity.js";

export class PublicPostMapper {

  public static toDto(post: Post, publicUrl: string) {
    let coverImageDto: PostCoverImageDto | null = null;
    if (post.coverImage) {
      coverImageDto = new PostCoverImageDto();
      coverImageDto.previewUrl = 
        createPreviewUrl(publicUrl, post.coverImage.fileKey);
      coverImageDto.width = post.coverImage.fileWidth;
      coverImageDto.height = post.coverImage.fileHeight;
      coverImageDto.size = post.coverImage.fileSizeByte;
      coverImageDto.versions = [];
      if (post.coverImage.versions?.length) {
        post.coverImage.versions.forEach((item: UploadVersion) => {
          coverImageDto?.versions.push({
            version: item.version,
            previewUrl: createPreviewUrl(publicUrl, item.fileKey),
            width: item.fileWidth,
            height: item.fileHeight,
            size: item.fileSizeByte,
          } as PostCoverImageVersionItemDto);
        })
      }
    }

    const postDto = new PublicPostDto();
    // postDto.id = post.id;
    postDto.category = {
      // id: post.category.id,
      name: post.category.name,
      slug: post.category.slug,
      languageCode: post.category.language.name.toLowerCase(),
    } as PublicPostCategoryDto;
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
    postDto.coverImage = coverImageDto;

    if (post.priorityId === prioritiesCached.updating.id) {
      postDto.priority = prioritiesCached.updating.name as 'updating';
    } else if (post.priorityId === prioritiesCached.updated.id) {
      postDto.priority = prioritiesCached.updated.name as 'updated';
    } else {
      postDto.priority = null;
    }

    postDto.author = {
      // id: post.author!.id,
      // email: post.author!.email,
      firstName: post.author!.firstName,
      lastName: post.author!.lastName,
    } as PostUserDto;

    postDto.cursor = generatePostCursor(
      post.isUpdating ? 1 : 0,
      post.sortAt, 
      post.id
    );

    return postDto;
  }
}
