// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/role.entity.js';
import { User } from '../users/user.entity.js';
import { RequestMeta } from './types/request-meta.type.js';

@Injectable()
export class AuthService {
  constructor(
    // private usersService: UsersService,
    private jwtService: JwtService,
    // private refreshTokenService: RefreshTokenService,
  ) {}

  // async register(dto: RegisterDto, meta: RequestMeta) {
  //   const existing = await this.usersService.findByEmail(dto.email);
  //   if (existing) throw new ConflictException('Email already in use');

  //   const hashed = await bcrypt.hash(dto.password, 10);
  //   const user = await this.usersService.create({
  //     email: dto.email,
  //     password: hashed,
  //   });

  //   return this.issueTokens(user.id, user.email, user.role, meta);
  // }

  // Called by LocalStrategy.validate()
  async validateUser(email: string, password: string) {
    // const user = await this.usersService.findByEmail(email);
    const user: User = {
      id: 1,
      email: 'johndoe@example.com',
      role: { id: 1, name: 'Admin' } as Role,
      password: 'somesecretpasswordhashed',
    } as User;
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // const match = await bcrypt.compare(password, user.password);
    // if (!match) throw new UnauthorizedException('Invalid credentials');

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async login(user: { id: string; email: string; role: string }, meta: RequestMeta) {
    return this.issueTokens(user.id, user.email, user.role, meta);
  }

  // async refresh(rawRefreshToken: string, meta: RequestMeta) {
  //   const { userId, raw, expiresAt } = await this.refreshTokenService.rotate(
  //     rawRefreshToken,
  //     meta,
  //   );

  //   const user = await this.usersService.findById(userId);
  //   if (!user) throw new UnauthorizedException('User no longer exists');

  //   const accessToken = this.signAccessToken(user.id, user.email, user.role);
  //   return { accessToken, refreshToken: raw, refreshExpiresAt: expiresAt };
  // }

  // async logout(rawRefreshToken: string) {
  //   await this.refreshTokenService.revoke(rawRefreshToken);
  // }

  // async logoutAll(userId: string) {
  //   await this.refreshTokenService.revokeAllForUser(userId);
  // }

  private async issueTokens(sub: string, email: string, role: string, meta: RequestMeta) {
    const accessToken = this.signAccessToken(sub, email, role);
    return { accessToken };
    // const { raw, expiresAt } = await this.refreshTokenService.issue(sub, meta);
    // return { accessToken, refreshToken: raw, refreshExpiresAt: expiresAt };
  }

  private signAccessToken(sub: string, email: string, role: string) {
    return this.jwtService.sign({ sub, email, role });
  }
}
