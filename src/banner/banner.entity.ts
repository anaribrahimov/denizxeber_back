import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BannerName } from '../banner-name/banner-name.entity.js';
import { Language } from '../language/language.entity.js';
import { Upload } from '../upload/upload.entity.js';

@Entity('banners')
@Index('UK_banners_lid_bnid', ['langId', 'bannerNameId'], {
  unique: true,
})
@Index('IDX_banners_lang', ['langId'])
export class Banner {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id',
  })
  id: number;

  @Column({
    name: 'banner_name_id',
    type: 'int',
  })
  bannerNameId: number;

  @Column({
    name: 'lang_id',
    type: 'int',
  })
  langId: number;

  @Column({
    name: 'cover_image_id',
    type: 'bigint',
    unsigned: true,
  })
  coverImageId: string;

  @Column({
    name: 'link',
    type: 'text',
    nullable: true,
  })
  link: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => BannerName, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'banner_name_id',
    referencedColumnName: 'id',
  })
  bannerName: BannerName;

  @ManyToOne(() => Language, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'lang_id',
    referencedColumnName: 'id',
  })
  language: Language;

  @ManyToOne(() => Upload, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'cover_image_id',
    referencedColumnName: 'id',
  })
  coverImage: Upload;
}
