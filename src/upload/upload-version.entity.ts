import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Upload } from './upload.entity.js';

export enum UploadVersionType {
  SMALL  = 'small',
  MEDIUM = 'medium',
  LARGE  = 'large',
}

@Entity('upload_versions')
export class UploadVersion {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: number;

  @Column({
    type: 'enum',
    enum: UploadVersionType,
    default: UploadVersionType.SMALL
  })
  version: UploadVersionType = UploadVersionType.SMALL;

  @Column({
    name: 'upload_id',
    type: 'bigint',
    unsigned: true
  })
  @Unique('uk_upload_versions_ui_v', ['upload_id', 'version'])
  uploadId: number;

  @Column({
    name: 'file_name',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  @Unique('uk_upload_versions_file_name', ['file_name'])
  fileName: string;

  @Column({
    name: 'file_key',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  @Unique('uk_upload_versions_file_key', ['file_key'])
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
    nullable: true,
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

  /**
   * Relations
   */

  @ManyToOne(() => Upload, (upload) => upload.versions)
  @JoinColumn({
    name: 'upload_id'
  })
  upload: Upload | null;
}
