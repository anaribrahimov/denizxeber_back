export class BannerPublicCoverImageVersionItemDto {
  version: string;
  previewUrl: string;
  width?: number | null;
  height?: number | null;
  size?: number | null;
}

export class BannerPublicCoverImageDto {
  previewUrl: string;
  width?: number | null;
  height?: number | null;
  size?: number | null;
  versions: BannerPublicCoverImageVersionItemDto[];
}
