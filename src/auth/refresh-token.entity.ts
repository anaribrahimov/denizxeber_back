import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity.js';

@Entity('refresh_tokens')
export class RefreshToken {

  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: number;

  @Column({ name: 'user_id' })
  @Index('IDX_refresh_tokens_user_id')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // SHA-256 hex digest of the raw token — never store the raw token
  @Index('IDX_refresh_tokens_token_hash', { unique: true })
  @Column({ name: 'token_hash' })
  tokenHash: string;

  @Column({ nullable: true, name: 'user_agent' })
  userAgent?: string;

  @Column({ nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @Column({ default: false })
  revoked: boolean;

  // Points to the token that replaced this one (for audit trail)
  @Column({ nullable: true, name: 'replaced_by_token_hash' })
  replacedByTokenHash?: string;

  @Column({ type: 'datetime', name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
