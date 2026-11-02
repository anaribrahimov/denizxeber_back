export class BannerCoverImageVersionItemDto {
  version: string;
  previewUrl: string;
  width?: number | null;
  height?: number | null;
  size?: number | null;
}

export class BannerCoverImageDto {
  id: string;
  previewUrl: string;
  width?: number | null;
  height?: number | null;
  size?: number | null;
  versions: BannerCoverImageVersionItemDto[];
}
