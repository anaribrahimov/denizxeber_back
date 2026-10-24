export class PostCreatedEvent {
  static readonly eventName = 'post.created';

  constructor(
    public readonly postId: string,
    public readonly languageName: string,
    public readonly title: string,
    public readonly url: string,
    public readonly excerpt: string,
    public readonly authorFullName: string,
    public readonly createdAt: Date,
    public readonly coverImageOriginal: string,
    public readonly coverImageThumbnail: string | null,
  ) {}
}
