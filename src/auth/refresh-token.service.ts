import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from './refresh-token.entity.js';
import { generateOpaqueToken, hashToken } from './utils/token.util.js';

export interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class RefreshTokenService {
  private readonly ttlMs: number;

  constructor(
    @InjectRepository(RefreshToken)
    private repo: Repository<RefreshToken>,
    private config: ConfigService,
  ) {
    const days = Number(this.config.get('REFRESH_TOKEN_TTL_DAYS') ?? 7);
    this.ttlMs = days * 24 * 60 * 60 * 1000;
  }

  async issue(userId: string, meta: RequestMeta): Promise<{ raw: string; expiresAt: Date }> {
    const raw = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + this.ttlMs);

    await this.repo.save(
      this.repo.create({
        userId,
        tokenHash: hashToken(raw),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      }),
    );

    return { raw, expiresAt };
  }

  /**
   * Validates a raw refresh token, rotates it, and returns the new one.
   * Throws on invalid/expired/reused tokens.
   */
  async rotate(
    rawToken: string,
    meta: RequestMeta,
  ): Promise<{ userId: string; raw: string; expiresAt: Date }> {
    const tokenHash = hashToken(rawToken);
    const existing = await this.repo.findOne({ where: { tokenHash } });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existing.revoked) {
      // Reuse of an already-rotated (or already-revoked) token = probable theft.
      // Nuke every session for this user and force re-login everywhere.
      await this.revokeAllForUser(existing.userId);
      throw new UnauthorizedException('Refresh token reuse detected — all sessions revoked');
    }

    if (existing.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Rotate: issue new, mark old as revoked + linked to the new one
    const next = await this.issue(existing.userId, meta);
    existing.revoked = true;
    existing.replacedByTokenHash = hashToken(next.raw);
    await this.repo.save(existing);

    return { userId: existing.userId, raw: next.raw, expiresAt: next.expiresAt };
  }

  async revoke(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    await this.repo.update({ tokenHash }, { revoked: true });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo.update({ userId, revoked: false }, { revoked: true });
  }

  // Call this from a scheduled job (see step 9)
  async purgeExpired(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}
