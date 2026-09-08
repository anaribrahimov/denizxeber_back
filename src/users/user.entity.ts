import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Upload } from '../uploads/upload.entity.js';
import { Role } from '../roles/role.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({
    type: 'int',
    unsigned: true,
  })
  id: number;

  @Column({
    name: 'first_name',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  firstName: string;

  @Column({
    name: 'last_name',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  lastName: string;

  @Index('IDX_users_email', { unique: true })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  password: string;

  @Column({
    name: 'role_id',
    type: 'tinyint',
    nullable: false,
  })
  roleId: number;

  @Column({
    name: 'lang_ids',
    type: 'json',
  })
  langIds: number[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    nullable: true,
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date | null;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    nullable: true,
  })
  deletedAt: Date | null;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: true,
    default: true,
  })
  isActive: boolean | null | undefined;

  @Index('IDX_users_profile_image_id', { unique: true })
  @Column({
    name: 'profile_image_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  profileImageId: number | null;

  // Relations

  @ManyToOne(() => Role, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToOne(() => Upload, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'profile_image_id' })
  profileImage: Upload | null;
}
