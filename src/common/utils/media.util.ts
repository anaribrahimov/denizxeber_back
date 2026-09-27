export function createPreviewUrl(publicUrl: string, fileKey: string): string {
  return `${publicUrl.replace(/\/$/, '')}/${fileKey.replace(/^\//, '')}`;
}
