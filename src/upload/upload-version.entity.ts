import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Upload } from './upload.entity.js';

@Entity('upload_versions')
@Index('idx_upload_versions_upload_id', ['uploadId'])
export class UploadVersion {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: number;

  @Column({
    name: 'upload_id',
    type: 'bigint',
    unsigned: true
  })
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

  @ManyToOne(() => Upload, (upload) => upload.versions, {
    lazy: true,
  })
  @JoinColumn({
    name: 'upload_id'
  })
  upload: Upload | null;
}
