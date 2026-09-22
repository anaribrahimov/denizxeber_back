// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/role.entity.js';
import { User } from '../users/user.entity.js';
import { RequestMeta } from './types/request-meta.type.js';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshTokenService } from './refresh-token.service.js';
import { Category } from '../category/category.entity.js';
import { AuthMapper } from './auth.mapper.js';
import { ValidatedUserDto } from './dto/validated-user.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    // private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private authMapper: AuthMapper,
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
  async validateUser(email: string, password: string): Promise<ValidatedUserDto> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: {
        role: true,
      }
    });

    // console.log('user', user);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    // const { password: _, ...safeUser } = user;

    // console.log('safeuser', safeUser);

    return this.authMapper.toValidatedUserDto(user);
  }

  async login(user: ValidatedUserDto, meta: RequestMeta) {
    let categories: Category[] = [];

    if (user?.langIds && user.langIds.length) {
      // fetch categories
      categories = await this.categoryRepository.find({
        where: {
          langId: In(user.langIds),
          isActive: true
        }
      });
    }

    const {
      accessToken,
      refreshToken,
      refreshExpiresAt,
    } = await this.issueTokens(user.id.toString(), user.email, user.role, meta);

    return {
      accessToken,
      refreshToken,
      refreshExpiresAt,
      user,
      categories,
    }
  }

  async refresh(rawRefreshToken: string, meta: RequestMeta) {
    const { userId, raw, expiresAt } = await this.refreshTokenService.rotate(
      rawRefreshToken,
      meta,
    );

    const user = await this.userRepository.findOne({
      where: { id: parseInt(userId) },
      relations: {
        role: true,
      }
    });
    if (!user) throw new UnauthorizedException('User no longer exists');

    const accessToken = this.signAccessToken(user.id.toString(), user.email, user.role);
    return { accessToken, refreshToken: raw, refreshExpiresAt: expiresAt };
  }

  async logout(rawRefreshToken: string) {
    await this.refreshTokenService.revoke(rawRefreshToken);
  }

  async logoutAll(userId: string) {
    await this.refreshTokenService.revokeAllForUser(userId);
  }

  private async issueTokens(
    sub: string, 
    email: string, 
    role: Role | null, 
    meta: RequestMeta): Promise<{ accessToken: string, refreshToken: string, refreshExpiresAt: Date }> {
    const accessToken = this.signAccessToken(sub, email, role);
    const { raw, expiresAt } = await this.refreshTokenService.issue(sub, meta);
    return { accessToken, refreshToken: raw, refreshExpiresAt: expiresAt };
  }

  private signAccessToken(sub: string, email: string, role: Role | null) {
    return this.jwtService.sign({ sub, email, role });
  }
}
