export function generatePublicPostPreviewUrl(slug: string, postPreviewUrl: string): string {
  // return (new URL(`public/posts/${slug}`, appUrl)).toString();
  return postPreviewUrl.replace('{slug}', slug);
}
