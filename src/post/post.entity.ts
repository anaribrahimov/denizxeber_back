import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Category } from '../category/category.entity.js';
import { Status } from '../status/status.entity.js';
import { Upload } from '../upload/upload.entity.js';
import { User } from '../users/user.entity.js';

@Entity({ name: 'posts' })
@Index(
  'IDX_posts_category_status_deleted_updating_sort',
  ['categoryId', 'statusId', 'deletedAt', 'isUpdating', 'sortAt'],
)
@Index(
  'IDX_posts_category_slug_deleted',
  ['categoryId', 'slug', 'deletedAt'],
)
export class Post {

  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: string;

  @Column({
    name: 'category_id',
    type: 'int',
    unsigned: true,
  })
  categoryId: number;

  @Column({
    name: 'author_id',
    type: 'int',
    unsigned: true,
  })
  authorId: number;

  @Column({
    name: 'status_id',
    type: 'tinyint',
  })
  statusId: number;

  @Column({
    name: 'cover_image_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  coverImageId: number | null;

  @Column({
    type: 'varchar',
    length: 200,
  })
  title: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  slug: string;

  @Column({
    type: 'longtext',
  })
  content: string;

  @Column({
    name: 'view_count',
    type: 'int',
    unsigned: true,
    default: 0,
  })
  viewCount: number;

  @Column({
    name: 'last_updated_by_id',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  lastUpdatedById: number | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    nullable: true,
  })
  // @Column({
  //   type: 'datetime',
  //   nullable: true
  // })
  deletedAt: Date | null;

  @Column({
    name: 'sort_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  sortAt: Date;

  @Column({
    name: 'is_updating',
    type: 'boolean',
  })
  isUpdating: boolean;

  /**
   * Relationships
   */

  @ManyToOne(() => Category, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'author_id' })
  author: User | null;

  @ManyToOne(() => Status, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'status_id' })
  status: Status | null;

  @ManyToOne(() => Upload, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'cover_image_id' })
  coverImage: Upload | null;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'last_updated_by_id' })
  lastUpdatedBy: User | null;
}
