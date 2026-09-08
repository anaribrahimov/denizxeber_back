import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
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
  id: Number;

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

  @Index('IDX_uploads_file_path', { unique: true })
  @Column({
    name: 'file_path',
    type: 'varchar',
    length: 500,
  })
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
  fileSizeInBytes: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}