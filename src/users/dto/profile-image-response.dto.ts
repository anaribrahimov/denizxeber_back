export class ProfileImageResponseVersionItemDto {
  version: string;
  previewUrl: string;
  width?: number | null;
  height?: number | null;
  size?: number | null;
}

export class ProfileImageResponseDto {

  
  id: string;
  
  previewUrl: string;

  width?: number | null;

  height?: number | null;

  size?: number | null;

  versions: ProfileImageResponseVersionItemDto[];
}
