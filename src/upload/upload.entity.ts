import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UploadVersion } from './upload-version.entity.js';

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
    length: 100,
  })
  @Unique('idx_uploads_file_name', ['file_name'])
  fileName: string;

  @Column({
    name: 'file_path',
    type: 'varchar',
    length: 500,
  })
  @Unique('IDX_uploads_file_path', ['file_path'])
  filePath: string;

  @Column({
    name: 'file_key',
    type: 'varchar',
    length: 255,
  })
  @Unique('idx_uploads_file_key', ['file_key'])
  fileKey: string;

  @Column({
    name: 'file_mimetype',
    type: 'varchar',
    length: 100,
  })
  fileMimeType: string;

  @Column({
    name: 'file_size_byte',
    type: 'bigint',
    unsigned: true,
  })
  fileSizeByte: number|null;

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
    name: 'duration_sec',
    type: 'bigint',
    unsigned: true,
  })
  durationSec: number | null;

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

  /**
   * Relations
   */

  @OneToMany(() => UploadVersion, (uploadVersion) => uploadVersion.upload)
  versions: UploadVersion[] | null;
}
