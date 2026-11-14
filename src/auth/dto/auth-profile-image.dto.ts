export class AuthProfileImageVersionItemDto {
  version: string;
  previewUrl: string;
  width?: number | null;
  height?: number | null;
  size?: number | null;
}

export class AuthProfileImageDto {
  id?: string;
  previewUrl: string;
  width?: number | null;
  height?: number | null;
  size?: number | null;
  versions: AuthProfileImageVersionItemDto[];
}
