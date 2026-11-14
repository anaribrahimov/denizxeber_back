export class PostCoverImageVersionItemDto {
  version: string;
  previewUrl: string;
  width?: number | null;
  height?: number | null;
  size?: number | null;
}

export class PostCoverImageDto {
  id: string;
  previewUrl: string;
  width?: number | null;
  height?: number | null;
  size?: number | null;
  versions: PostCoverImageVersionItemDto[];
}
