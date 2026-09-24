import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export enum UploadType {
  PRIVATE = 'private',
  PUBLIC = 'public',
}

export enum UploadFileType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('uploads')
export class Upload {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: number;

  @Column({
    type: 'enum',
    enum: UploadType,
    default: UploadType.PUBLIC,
  })
  type: UploadType;

  @Column({
    name: 'file_original_name',
    type: 'varchar',
    length: 255,
  })
  fileOriginalName: string;

  @Column({
    name: 'file_name',
    type: 'varchar',
    length: 255,
  })
  fileName: string;

  @Column({
    name: 'file_path',
    type: 'varchar',
    length: 500,
  })
  @Unique('IDX_uploads_file_path', ['file_path'])
  filePath: string;

  @Column({
    name: 'mime_type',
    type: 'varchar',
    length: 100,
  })
  mimeType: string;

  @Column({
    name: 'file_size_in_bytes',
    type: 'bigint',
    unsigned: true,
  })
  fileSizeInBytes: number|null;

  @Column({
    name: 'file_width',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  fileWidth: number | null;

  @Column({
    name: 'file_height',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  fileHeight: number | null;

  @Column({
    name: 'thumb_path',
    type: 'varchar',
    nullable: true
  })
  @Unique('UQ_uploads_thumb_path', ['thumb_path'])
  thumbPath: string | null;

  @Column({
    name: 'thumb_width',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  thumbWidth: number | null;

  @Column({
    name: 'thumb_height',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  thumbHeight: number | null;

  @Column({
    name: 'thumb_size_in_bytes',
    type: 'bigint',
    unsigned: true,
  })
  thumbSizeInBytes: number | null;

  @Column({
    name: 'duration_in_sec',
    type: 'bigint',
    unsigned: true,
  })
  durationInSec: number | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    nullable: true,
  })
  deletedAt: Date | null;
}
