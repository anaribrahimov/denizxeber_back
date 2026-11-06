import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "./post.entity.js";

@Entity({ name: 'post_slug_histories' })
export class PostSlugHistory {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: string;

  @Column({
    name: 'post_id',
    type: 'bigint',
    nullable: false,
  })
  postId: string;

  @Column({
    name: 'slug',
    unique: true,
    nullable: false,
  })
  @Index('UK_psh_slug', ['slug'])
  slug: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  /**
   * Relationships
   */
  
  @ManyToOne(() => Post, {
    onDelete: 'RESTRICT'
  })
  @JoinColumn({
    name: 'post_id'
  })
  post: Post | null;
}
